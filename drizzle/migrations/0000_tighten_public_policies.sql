DROP POLICY IF EXISTS "Anyone can read employees" ON public.employees;
DROP POLICY IF EXISTS "Anyone can read residential objects" ON public.residential_objects;
DROP POLICY IF EXISTS "Anyone can read settings for integrations" ON public.app_settings;

DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit new feedback" ON public.feedback
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND assigned_to IS NULL
  AND task_status_id IS NULL
  AND task_substatus_id IS NULL
  AND bitrix_task_id IS NULL
  AND final_photo_url IS NULL
  AND redirected_from IS NULL
  AND is_blocker = false
  AND length(message) BETWEEN 1 AND 10000
  AND (name IS NULL OR length(name) <= 200)
  AND (contact IS NULL OR length(contact) <= 200)
);

DROP POLICY IF EXISTS "Anyone can upload feedback attachments" ON storage.objects;
CREATE POLICY "Anyone can upload feedback attachments" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'feedback-attachments'
  AND (storage.foldername(name))[1] IN ('attachments', 'final-photos')
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','gif','webp','heic','pdf','mp4','mov','doc','docx','xls','xlsx')
);