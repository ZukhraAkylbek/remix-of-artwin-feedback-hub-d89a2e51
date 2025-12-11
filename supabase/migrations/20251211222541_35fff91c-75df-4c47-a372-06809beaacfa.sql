-- Add Bitrix webhook URL column to department_settings
ALTER TABLE public.department_settings
ADD COLUMN bitrix_webhook_url text;