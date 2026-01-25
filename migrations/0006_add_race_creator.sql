-- Add creator_participant_id column to races table
-- This tracks who created the race and should always be the initial host
ALTER TABLE races ADD COLUMN IF NOT EXISTS creator_participant_id INTEGER;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS race_creator_idx ON races(creator_participant_id);
