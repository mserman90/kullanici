
CREATE TABLE public.shared_results (
  id TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(6), 'hex'),
  username TEXT NOT NULL,
  search_mode TEXT NOT NULL DEFAULT 'username',
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_results ENABLE ROW LEVEL SECURITY;

-- Anyone can read shared results
CREATE POLICY "Anyone can read shared results"
  ON public.shared_results
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can insert shared results
CREATE POLICY "Anyone can insert shared results"
  ON public.shared_results
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
