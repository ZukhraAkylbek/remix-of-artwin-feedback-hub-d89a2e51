-- 1. Create storage bucket for feedback attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-attachments', 'feedback-attachments', true);

-- Storage policies for feedback attachments
CREATE POLICY "Anyone can upload feedback attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'feedback-attachments');

CREATE POLICY "Anyone can view feedback attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'feedback-attachments');

CREATE POLICY "Admins can delete feedback attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'feedback-attachments' AND has_role(auth.uid(), 'admin'));

-- 2. Create employees table for responsible assignment
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  department TEXT NOT NULL,
  position TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage employees"
ON public.employees FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read employees"
ON public.employees FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create admin action log table
CREATE TABLE public.admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read action logs"
ON public.admin_action_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert action logs"
ON public.admin_action_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. Create objects/residential complexes table
CREATE TABLE public.residential_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.residential_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read residential objects"
ON public.residential_objects FOR SELECT
USING (true);

CREATE POLICY "Admins can manage residential objects"
ON public.residential_objects FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default residential objects
INSERT INTO public.residential_objects (code, name) VALUES
  ('TKY', 'ЖК «Tokyo»'),
  ('EST', 'ЖК "Эсентай"'),
  ('TKC', 'ЖК "Токио Сити"'),
  ('SEL', 'БЦ "Сеул"'),
  ('HYT', 'ЖК "Хаят"'),
  ('URP', 'ЖК "Урпак"'),
  ('WLT', 'ЖК "Вилтон парк"'),
  ('LND', 'ЖК "Лондон"'),
  ('S_УЧ', 'Соц проект: садик "Үмүт чырагы"');

-- 5. Add new columns to feedback table
ALTER TABLE public.feedback 
  ADD COLUMN IF NOT EXISTS object_code TEXT,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL;

-- 6. Create index for faster queries
CREATE INDEX idx_feedback_object_code ON public.feedback(object_code);
CREATE INDEX idx_feedback_assigned_to ON public.feedback(assigned_to);
CREATE INDEX idx_admin_logs_entity ON public.admin_action_logs(entity_type, entity_id);
CREATE INDEX idx_admin_logs_created_at ON public.admin_action_logs(created_at DESC);