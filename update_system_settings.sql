-- Update system_settings table for Rate Limiting Controls

-- Add columns if they don't exist
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS enable_guest_access BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS enable_ip_check BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS guest_generation_limit INTEGER DEFAULT 1;

-- Refresh schema cache if needed (Supabase usually handles this)
NOTIFY pgrst, 'reload schema';
