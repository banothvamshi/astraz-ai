-- Add subscription_end_date column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Comment to explain usage
COMMENT ON COLUMN profiles.subscription_end_date IS 'Timestamp when the current premium subscription expires';
