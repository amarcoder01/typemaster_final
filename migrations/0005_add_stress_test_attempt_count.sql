-- Add attempt_count column to stress_tests table to track total test attempts per difficulty
-- This allows accurate counting of total tests even though only best scores are stored

ALTER TABLE stress_tests 
ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 1;

-- Update existing records to have attempt_count = 1 (historical data)
UPDATE stress_tests SET attempt_count = 1 WHERE attempt_count IS NULL;
