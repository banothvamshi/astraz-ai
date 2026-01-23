-- ============================================
-- IMPROVEMENTS & FIXES SCRIPT
-- ============================================

-- 1. FIX: Generation Count & Credit Deduction Logic
-- The previous function only counted total generations but didn't handle credit deduction.
-- We are splitting logic: 'Free' users burn 'free_generations_used'. 'Credit' users burn 'credits_remaining'.
CREATE OR REPLACE FUNCTION public.increment_generation_count(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_credits INTEGER;
  v_free_used INTEGER;
BEGIN
  -- Get current status
  SELECT is_premium, credits_remaining, free_generations_used 
  INTO v_is_premium, v_credits, v_free_used
  FROM public.profiles 
  WHERE id = user_uuid;

  -- Logic:
  -- If Premium: Just increment total.
  -- If Credits > 0: Decrement credits, increment total.
  -- If Credits = -1 (Unlimited): Just increment total.
  -- Else (Free): Increment free_generations_used, increment total.

  UPDATE public.profiles
  SET 
    total_generations = COALESCE(total_generations, 0) + 1,
    free_generations_used = CASE 
      WHEN v_is_premium = FALSE AND (v_credits IS NULL OR v_credits = 0) 
      THEN COALESCE(free_generations_used, 0) + 1 
      ELSE free_generations_used 
    END,
    credits_remaining = CASE 
      WHEN v_credits > 0 THEN v_credits - 1 
      ELSE credits_remaining 
    END,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. IMPROVEMENT: Atomic Coupon Redemption
-- Prevents race conditions where a coupon is used more than max_uses.
-- Returns query result to API to confirm success.
CREATE OR REPLACE FUNCTION public.redeem_coupon(coupon_code TEXT)
RETURNS TABLE (success BOOLEAN, discount_val INTEGER, discount_type_result TEXT) AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  -- Check validity and lock row for update
  SELECT * INTO v_coupon FROM public.coupons 
  WHERE code = coupon_code AND is_active = true 
  FOR UPDATE; -- Locks the row

  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'none'::TEXT;
    RETURN;
  END IF;

  -- Check expiry
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN QUERY SELECT FALSE, 0, 'expired'::TEXT;
    RETURN;
  END IF;

  -- Check usage limits
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
    RETURN QUERY SELECT FALSE, 0, 'max_uses'::TEXT;
    RETURN;
  END IF;

  -- Increment usage atomically
  UPDATE public.coupons 
  SET uses_count = uses_count + 1 
  WHERE id = v_coupon.id;

  RETURN QUERY SELECT TRUE, v_coupon.discount_value, v_coupon.discount_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. CLEANUP: Drop dead table
DROP TABLE IF EXISTS public.user_profiles;

-- 4. FIX: Account Plan Expiry Handler (Database Side)
-- Ensure 'is_premium' is false if 'subscription_end_date' is passed.
-- Run this function periodically (e.g. via cron) or check on login (middleware handles this too).
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_end_date IS NOT NULL AND NEW.subscription_end_date < NOW() THEN
    NEW.is_premium := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_profile_update_expiry
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_subscription_expiry();

-- Force update search paths for safety (re-applying from audit)
ALTER FUNCTION public.increment_generation_count(UUID) SET search_path = public;
ALTER FUNCTION public.redeem_coupon(TEXT) SET search_path = public;
ALTER FUNCTION public.check_subscription_expiry() SET search_path = public;
