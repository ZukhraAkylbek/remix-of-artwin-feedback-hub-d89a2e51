-- Add unique constraint on department for upsert to work
ALTER TABLE public.department_settings
ADD CONSTRAINT department_settings_department_unique UNIQUE (department);