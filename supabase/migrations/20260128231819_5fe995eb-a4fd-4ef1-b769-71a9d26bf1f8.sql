-- Create task_statuses table (parent statuses per department)
CREATE TABLE public.task_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL,
  name TEXT NOT NULL,
  is_final BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create task_substatuses table (child statuses linked to parent)
CREATE TABLE public.task_substatuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status_id UUID NOT NULL REFERENCES public.task_statuses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add final_photo_url field to feedback table
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS final_photo_url TEXT;

-- Add status_id field to feedback table for new status system
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS task_status_id UUID REFERENCES public.task_statuses(id);
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS task_substatus_id UUID REFERENCES public.task_substatuses(id);

-- Enable RLS on task_statuses
ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_statuses
CREATE POLICY "Admins can manage task_statuses"
  ON public.task_statuses
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read task_statuses"
  ON public.task_statuses
  FOR SELECT
  USING (true);

-- Enable RLS on task_substatuses
ALTER TABLE public.task_substatuses ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_substatuses
CREATE POLICY "Admins can manage task_substatuses"
  ON public.task_substatuses
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read task_substatuses"
  ON public.task_substatuses
  FOR SELECT
  USING (true);

-- Add indexes for better performance
CREATE INDEX idx_task_statuses_department ON public.task_statuses(department);
CREATE INDEX idx_task_substatuses_status_id ON public.task_substatuses(status_id);
CREATE INDEX idx_feedback_task_status ON public.feedback(task_status_id);
CREATE INDEX idx_feedback_task_substatus ON public.feedback(task_substatus_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_substatuses;