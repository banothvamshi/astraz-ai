-- ============================================
-- ASTRAZ AI - COMPLETE DATABASE SCHEMA
-- ============================================
-- Run this in your Supabase SQL Editor
-- This is a FRESH schema - run this first before anything else
-- ============================================

-- ============================================
-- 1. CORE TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_type TEXT, -- 'basic', 'pro', 'unlimited'
  premium_until TIMESTAMP WITH TIME ZONE, -- NULL for lifetime
  free_generations_used INTEGER DEFAULT 0,
  total_generations INTEGER DEFAULT 0,
  first_login_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. PAYMENT & SUBSCRIPTION TABLES
-- ============================================

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT UNIQUE,
  amount INTEGER NOT NULL, -- Amount in smallest currency unit (paise/cents)
  currency TEXT DEFAULT 'INR',
  plan_type TEXT, -- 'basic', 'pro', 'unlimited'
  status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. RESUME GENERATION TABLES
-- ============================================

-- Generation history (tracks every resume generated)
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  job_title TEXT,
  company_name TEXT,
  job_location TEXT,
  resume_content TEXT, -- The generated markdown content
  original_resume_text TEXT, -- Original parsed text (for debugging)
  job_description_text TEXT, -- The JD used
  is_free_generation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF History (downloadable copies)
CREATE TABLE IF NOT EXISTS public.pdf_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  generation_id UUID REFERENCES public.generations(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- Markdown content snapshot
  job_title TEXT,
  company_name TEXT,
  pdf_url TEXT, -- Supabase Storage URL (future feature)
  file_size INTEGER, -- In bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. SUPPORT SYSTEM TABLES
-- ============================================

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- general, billing, technical, feature_request
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  status TEXT DEFAULT 'open', -- open, in_progress, waiting_response, resolved, closed
  assigned_to UUID REFERENCES public.profiles(id), -- Admin assigned
  admin_response TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Ticket Messages (for threaded conversations)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  sender_type TEXT NOT NULL, -- 'user' or 'admin'
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. ANALYTICS & TRACKING TABLES
-- ============================================

-- User activity log (for analytics)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'generate_resume', 'download_pdf', 'upgrade', etc.
  metadata JSONB, -- Flexible data storage
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature flags (for gradual rollouts)
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  enabled_for_users UUID[], -- Specific users (for beta testing)
  enabled_for_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES - USER ACCESS
-- ============================================

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Payments: Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Generations: Users can view/insert their own generations
CREATE POLICY "Users can view own generations" ON public.generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PDF History: Users can view/insert their own PDFs
CREATE POLICY "Users can view own pdf history" ON public.pdf_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pdf history" ON public.pdf_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Support Tickets: Users can view/insert their own tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ticket Messages: Users can view messages on their tickets
CREATE POLICY "Users can view ticket messages" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can send ticket messages" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
  );

-- ============================================
-- 8. RLS POLICIES - ADMIN ACCESS
-- ============================================

-- Admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Admins can read all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Admins can read all payments
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (public.is_admin());

-- Admins can read all generations
CREATE POLICY "Admins can view all generations" ON public.generations
  FOR SELECT USING (public.is_admin());

-- Admins can read/update all tickets
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all tickets" ON public.support_tickets
  FOR UPDATE USING (public.is_admin());

-- Admins can view/send all ticket messages
CREATE POLICY "Admins can view all ticket messages" ON public.ticket_messages
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can send ticket messages" ON public.ticket_messages
  FOR INSERT WITH CHECK (public.is_admin());

-- Admins can manage feature flags
CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
  FOR ALL USING (public.is_admin());

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Check if user is premium
CREATE OR REPLACE FUNCTION public.is_premium(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_premium FROM public.profiles WHERE id = user_uuid),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Get remaining free generations
CREATE OR REPLACE FUNCTION public.get_remaining_free_generations(user_uuid UUID DEFAULT auth.uid())
RETURNS INTEGER AS $$
  SELECT GREATEST(0, 1 - COALESCE(
    (SELECT free_generations_used FROM public.profiles WHERE id = user_uuid),
    0
  ));
$$ LANGUAGE sql SECURITY DEFINER;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Increment generation count for user
CREATE OR REPLACE FUNCTION public.increment_generation_count(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_generations = COALESCE(total_generations, 0) + 1,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON public.profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdf_history_user_id ON public.pdf_history(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);

-- ============================================
-- DONE! Your database is ready.
-- ============================================
