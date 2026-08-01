-- Migration: v10_user_trigger
-- Description: Create a trigger to automatically insert new auth users into the public.users table

-- Create the function that will handle the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, phone_or_email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown User'), 
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill any existing users that might have been created without the trigger
INSERT INTO public.users (id, name, phone_or_email)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', 'Unknown User'), 
  email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
