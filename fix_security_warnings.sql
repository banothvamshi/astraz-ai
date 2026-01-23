-- ============================================
-- SECURITY FIXES & HARDENING SCRIPT
-- ============================================

-- 1. Fix "Function Search Path Mutable" (CWE-426)
-- Forces functions to use a secure search path (public) to prevent hijacking.

ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_premium(user_uuid UUID) SET search_path = public; -- Note: signature match
ALTER FUNCTION public.get_remaining_free_generations(user_uuid UUID) SET search_path = public;
ALTER FUNCTION public.increment_generation_count(user_uuid UUID) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 2. Fix "RLS Policy Always True" for usage_logs
-- The warning indicates bypassing RLS. 
-- If usage_logs is for system logs, users shouldn't insert freely.
-- Restricting to authenticated users or service role.

DROP POLICY IF EXISTS "Public/Service can insert logs" ON public.usage_logs;

CREATE POLICY "Authenticated users can insert usage logs" ON public.usage_logs
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- 3. Fix "RLS Enabled No Policy" for activity_log
-- Adding policies to allow service role full access and users to view their own.

DROP POLICY IF EXISTS "Admins/Service can do everything on activity_log" ON public.activity_log;
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;

-- Allow Service Role (and Admins) full access
CREATE POLICY "Admins/Service can do everything on activity_log" ON public.activity_log
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true) OR auth.role() = 'service_role');

-- Allow Users to view their own activity
CREATE POLICY "Users can view own activity" ON public.activity_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Optional: Allow users to insert their own activity (if frontend logging is needed)
CREATE POLICY "Users can insert own activity" ON public.activity_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- POTENTIAL IMPROVEMENTS & OPTIMIZATIONS
-- ============================================

-- 4. Coupon Usage Atomicity
-- Current logic uses SELECT then later check. In high concurrency, this is a race condition.
-- Below is a snippet to handle it atomically (for future implementation in your API):
/*
  UPDATE coupons 
  SET uses_count = uses_count + 1 
  WHERE code = 'COUPON_CODE' 
    AND (max_uses IS NULL OR uses_count < max_uses)
    AND (valid_until IS NULL OR valid_until > NOW())
    AND is_active = true
  RETURNING id;
*/
