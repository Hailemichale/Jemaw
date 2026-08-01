-- Add is_edited and is_deleted columns to messages table
ALTER TABLE public.messages ADD COLUMN is_edited BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN is_deleted BOOLEAN DEFAULT false;
