-- Tillåt miniräknare per fråga (t.ex. högskoleprov / matte med räknare)
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS allows_calculator boolean NOT NULL DEFAULT false;
