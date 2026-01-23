-- ============================================
-- FINAL SECURITY FIX FOR usage_logs
-- ============================================

-- The previous policy was:
-- CHECK (true) for authenticated users.
-- Supabase warns this is "too permissive" because ANY authenticated user can insert ANY data.

-- We will tighten it so users can only insert logs where 'user_email' matches their own email.
-- This satisfies the security linter.

DROP POLICY IF EXISTS "Authenticated users can insert usage logs" ON public.usage_logs;

CREATE POLICY "Authenticated users can insert usage logs" ON public.usage_logs
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    -- Allow if the log's user_email matches the authenticated user's email
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    -- ALSO allow if it's the Service Role (admin operations)
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Note regarding "Leaked Password Protection":
-- This cannot be fixed via SQL. You must go to:
-- Supabase Dashboard -> Authentication -> Security -> Enable "Leaked Password Protection" (Powered by HaveIBeenPwned)
