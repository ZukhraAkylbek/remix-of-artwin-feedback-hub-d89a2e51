-- Add sub_status column to feedback table
ALTER TABLE public.feedback 
ADD COLUMN sub_status TEXT DEFAULT NULL;

-- Add bitrix_task_id column to track linked Bitrix tasks
ALTER TABLE public.feedback 
ADD COLUMN bitrix_task_id TEXT DEFAULT NULL;

-- Create index for faster lookup by bitrix_task_id
CREATE INDEX idx_feedback_bitrix_task_id ON public.feedback(bitrix_task_id);

-- Add comment explaining the sub_status values
COMMENT ON COLUMN public.feedback.sub_status IS 'Sub-status for in_progress: working_group, management_meeting, foremen_tech_meeting, managers_meeting, top_management_meeting, site_inspection, project_committee, production_meeting';