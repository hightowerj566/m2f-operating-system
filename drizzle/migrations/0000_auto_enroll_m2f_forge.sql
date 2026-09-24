CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.program_assignments WHERE user_id = NEW.id AND is_active) THEN
    INSERT INTO public.program_assignments (user_id, program_id, assigned_by, current_day, is_active, status, scheduled_start_date)
    VALUES (NEW.id, 'd7a417b5-bdb6-4c2c-a91a-be89b278b2ca', 'bd99286f-3d70-4c19-81c5-bbf94a040c9a', 1, true, 'active', CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$function$;

INSERT INTO public.program_assignments (user_id, program_id, assigned_by, current_day, is_active, status, scheduled_start_date)
SELECT p.user_id, 'd7a417b5-bdb6-4c2c-a91a-be89b278b2ca', 'bd99286f-3d70-4c19-81c5-bbf94a040c9a', 1, true, 'active', CURRENT_DATE
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.program_assignments a WHERE a.user_id = p.user_id AND a.is_active)
  AND NOT public.is_coach_or_admin(p.user_id);