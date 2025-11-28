-- Ensure columns exist with defaults
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Backfill null values for existing records
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;
UPDATE public.profiles SET status = 'pending' WHERE status IS NULL;
UPDATE public.profiles SET created_at = now() WHERE created_at IS NULL;

-- Verify the update (optional, for logging)
-- SELECT * FROM public.profiles;
