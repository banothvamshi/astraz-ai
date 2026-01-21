-- Add cover_letter_content column to generations table
ALTER TABLE generations 
ADD COLUMN IF NOT EXISTS cover_letter_content TEXT;

-- Comment to explain usage
COMMENT ON COLUMN generations.cover_letter_content IS 'Generated cover letter text, if any';
