GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT INSERT ON public.feedback TO anon;
GRANT SELECT ON public.task_statuses, public.task_substatuses TO anon;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_comments;
EXCEPTION WHEN others THEN NULL; END $$;
