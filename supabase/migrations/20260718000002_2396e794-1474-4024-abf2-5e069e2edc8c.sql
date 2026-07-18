REVOKE ALL ON public.programs FROM anon, authenticated;
GRANT SELECT ON public.programs TO anon, authenticated;
GRANT ALL ON public.programs TO service_role;

REVOKE ALL ON public.program_assignments FROM anon;
REVOKE ALL ON public.program_assignments FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_assignments TO authenticated;
GRANT ALL ON public.program_assignments TO service_role;