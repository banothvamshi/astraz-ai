-- Astraz AI Extended Database Schema
-- Run this in your Supabase SQL Editor AFTER the original schema

-- PDF History (store generated resumes for user portal)
CREATE TABLE IF NOT EXISTS public.pdf_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  content TEXT NOT NULL,
  job_title TEXT,
  company_name TEXT,
  pdf_url TEXT, -- Optional: Store in Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open, in_progress, resolved
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add admin flag to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Enable RLS on new tables
ALTER TABLE public.pdf_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_history
CREATE POLICY "Users can read own pdf history" ON public.pdf_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pdf history" ON public.pdf_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for support_tickets
CREATE POLICY "Users can read own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can read all (for admin dashboard)
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can read all tickets" ON public.support_tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update tickets" ON public.support_tickets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
