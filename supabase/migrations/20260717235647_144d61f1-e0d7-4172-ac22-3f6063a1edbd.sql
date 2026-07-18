GRANT SELECT ON public.programs TO anon, authenticated;
GRANT ALL ON public.programs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_assignments TO authenticated;
GRANT ALL ON public.program_assignments TO service_role;