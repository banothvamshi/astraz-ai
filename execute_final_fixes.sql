-- ============================================
-- FINAL IMPROVEMENTS & FIXES SCRIPT
-- ============================================

-- 1. FIX: Generation Count & Credit Deduction Logic
CREATE OR REPLACE FUNCTION public.increment_generation_count(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_credits INTEGER;
  v_free_used INTEGER;
BEGIN
  SELECT is_premium, credits_remaining, free_generations_used 
  INTO v_is_premium, v_credits, v_free_used
  FROM public.profiles 
  WHERE id = user_uuid;

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
CREATE OR REPLACE FUNCTION public.redeem_coupon(coupon_code TEXT)
RETURNS TABLE (success BOOLEAN, discount_val INTEGER, discount_type_result TEXT) AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  SELECT * INTO v_coupon FROM public.coupons 
  WHERE code = coupon_code AND is_active = true 
  FOR UPDATE; 

  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'none'::TEXT;
    RETURN;
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN QUERY SELECT FALSE, 0, 'expired'::TEXT;
    RETURN;
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
    RETURN QUERY SELECT FALSE, 0, 'max_uses'::TEXT;
    RETURN;
  END IF;

  UPDATE public.coupons 
  SET uses_count = uses_count + 1 
  WHERE id = v_coupon.id;

  RETURN QUERY SELECT TRUE, v_coupon.discount_value, v_coupon.discount_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. FIX: Account Plan Expiry Handler (Automated)
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_end_date IS NOT NULL AND NEW.subscription_end_date < NOW() THEN
    NEW.is_premium := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_update_expiry ON public.profiles;
CREATE TRIGGER on_profile_update_expiry
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_subscription_expiry();

-- Force search paths for security
ALTER FUNCTION public.increment_generation_count(UUID) SET search_path = public;
ALTER FUNCTION public.redeem_coupon(TEXT) SET search_path = public;
ALTER FUNCTION public.check_subscription_expiry() SET search_path = public;
