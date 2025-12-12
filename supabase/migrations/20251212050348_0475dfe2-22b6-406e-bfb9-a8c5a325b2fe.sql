-- Add deadline column to feedback table
ALTER TABLE public.feedback 
ADD COLUMN deadline timestamp with time zone DEFAULT NULL;

-- Add deadline_enabled setting to app_settings if not exists
INSERT INTO public.app_settings (key, value)
VALUES ('deadline_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;