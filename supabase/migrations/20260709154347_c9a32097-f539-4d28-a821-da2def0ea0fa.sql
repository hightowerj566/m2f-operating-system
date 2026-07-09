
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  default_program_id uuid := 'a5aeb887-542c-44ae-abb9-a6746284554d';
  default_coach_id   uuid := 'bd99286f-3d70-4c19-81c5-bbf94a040c9a';
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  -- Auto-enroll every new member in the default program (M2F Perform 3.0)
  IF EXISTS (SELECT 1 FROM public.programs WHERE id = default_program_id) THEN
    INSERT INTO public.program_assignments (user_id, program_id, current_day, assigned_by, is_active)
    VALUES (NEW.id, default_program_id, 1, default_coach_id, true)
    ON CONFLICT (user_id, program_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
