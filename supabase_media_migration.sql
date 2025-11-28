-- Add media columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT,
ADD COLUMN IF NOT EXISTS caption TEXT;

-- Add location and contact columns as JSONB for future proofing (optional but good practice based on types.ts)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS location_data JSONB,
ADD COLUMN IF NOT EXISTS contact_data JSONB;
