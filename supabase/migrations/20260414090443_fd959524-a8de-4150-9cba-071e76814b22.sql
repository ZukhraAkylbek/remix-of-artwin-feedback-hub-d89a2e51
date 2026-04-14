
-- Create comments table
CREATE TABLE public.ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can read comments"
ON public.ticket_comments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert comments"
ON public.ticket_comments FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete comments"
ON public.ticket_comments FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookup
CREATE INDEX idx_ticket_comments_feedback_id ON public.ticket_comments(feedback_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_comments;
