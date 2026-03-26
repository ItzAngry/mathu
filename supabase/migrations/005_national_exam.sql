-- Add national exam fields to nodes table
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS is_national_exam boolean DEFAULT false;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS exam_year integer;
