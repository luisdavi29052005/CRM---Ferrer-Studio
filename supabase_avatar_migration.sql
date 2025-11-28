-- Add avatar_url column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Update the handle_new_user function to copy avatar_url from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status, avatar_url)
  VALUES (
    new.id,
    new.email,
    'user',
    'pending',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Backfill existing users (this is tricky without direct access to auth.users from here, 
-- but the App.tsx update will handle it on next login)
