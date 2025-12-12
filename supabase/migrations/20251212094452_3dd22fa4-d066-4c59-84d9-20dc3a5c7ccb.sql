-- Create user_departments table to link users to their departments
CREATE TABLE public.user_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- Users can read their own department
CREATE POLICY "Users can read own department"
ON public.user_departments
FOR SELECT
USING (user_id = auth.uid());

-- Admins can manage all departments
CREATE POLICY "Admins can manage user departments"
ON public.user_departments
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert department associations for existing users
INSERT INTO public.user_departments (user_id, department)
SELECT u.id, 
  CASE 
    WHEN u.email = 'management@artwin.kg' THEN 'management'
    WHEN u.email = 'reception@artwin.kg' THEN 'reception'
    WHEN u.email = 'sales@artwin.kg' THEN 'sales'
    WHEN u.email = 'hr@artwin.kg' THEN 'hr'
    WHEN u.email = 'marketing@artwin.kg' THEN 'marketing'
    WHEN u.email = 'clients@artwin.kg' THEN 'favorites_ssl'
    WHEN u.email = 'tech@artwin.kg' THEN 'construction_tech'
    WHEN u.email = 'safety@artwin.kg' THEN 'other'
    ELSE 'management'
  END
FROM auth.users u
WHERE u.email IN (
  'management@artwin.kg', 'reception@artwin.kg', 'sales@artwin.kg', 
  'hr@artwin.kg', 'marketing@artwin.kg', 'clients@artwin.kg', 
  'tech@artwin.kg', 'safety@artwin.kg', 'artwinfeed@gmail.com'
);