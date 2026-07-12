
REVOKE ALL ON FUNCTION public.generate_scheduled_weeks(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_scheduled_weeks(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.week_is_accessible(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.week_is_accessible(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.compute_week_unlock_at(date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.compute_week_unlock_at(date, text) TO authenticated, service_role;
