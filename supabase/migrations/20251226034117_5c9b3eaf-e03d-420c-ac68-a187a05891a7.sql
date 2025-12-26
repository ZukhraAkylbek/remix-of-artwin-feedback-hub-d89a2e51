-- Add urgency_level field (1-4) for priority levels
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS urgency_level integer DEFAULT 1 CHECK (urgency_level >= 1 AND urgency_level <= 4);

-- Add redirected_from to track original department when redirected
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS redirected_from text DEFAULT NULL;

-- Add redirected_at timestamp
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS redirected_at timestamp with time zone DEFAULT NULL;

-- Create index for faster queries on urgency_level
CREATE INDEX IF NOT EXISTS idx_feedback_urgency_level ON public.feedback(urgency_level);

-- Create index for redirected_from queries
CREATE INDEX IF NOT EXISTS idx_feedback_redirected_from ON public.feedback(redirected_from) WHERE redirected_from IS NOT NULL;