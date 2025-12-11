-- Create table for dynamic sub-statuses
CREATE TABLE public.sub_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.sub_statuses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can read sub_statuses"
ON public.sub_statuses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert sub_statuses"
ON public.sub_statuses
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sub_statuses"
ON public.sub_statuses
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sub_statuses"
ON public.sub_statuses
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default sub-statuses for all departments
INSERT INTO public.sub_statuses (name, department) VALUES
  ('Рабочая группа', 'management'),
  ('Собрание руководства', 'management'),
  ('Собрание прорабов с тех отделом (пн 8:00)', 'management'),
  ('Собрание руководителей (пн 10:00)', 'management'),
  ('Собрание топ менеджмента (пн 14:00)', 'management'),
  ('Обходы по объектам', 'management'),
  ('Собрание проектного комитета (1/в 2 недели)', 'management'),
  ('Производственные собрания', 'management');