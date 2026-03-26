-- Add points column to questions table
-- Default 1 point per question; must be >= 1
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 1 CHECK (points >= 1);
