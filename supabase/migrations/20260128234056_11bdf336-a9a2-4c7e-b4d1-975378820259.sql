-- Add is_blocker field to feedback table
ALTER TABLE public.feedback ADD COLUMN is_blocker boolean NOT NULL DEFAULT false;