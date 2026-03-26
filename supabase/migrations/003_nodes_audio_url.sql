-- Optional audio URL for node-level TTS (läsavsnitt / intro nodes)
ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS audio_url text;
