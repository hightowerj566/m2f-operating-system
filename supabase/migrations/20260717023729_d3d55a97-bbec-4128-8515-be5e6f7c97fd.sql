-- Remove auto-enroll in Perform 3.0 from the new-user trigger. New members
-- now default to the time-based guided journey (pre-birth → post-birth), and
-- coaches can still assign a custom program through the coach UI.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$function$;

-- Deactivate the previously auto-enrolled Perform 3.0 assignments so existing
-- members fall through to the guided time-based journey. Real coach-assigned
-- programs (assigned_by <> the auto-enroll coach id) are preserved.
UPDATE public.program_assignments
SET is_active = false
WHERE program_id = 'a5aeb887-542c-44ae-abb9-a6746284554d'
  AND assigned_by = 'bd99286f-3d70-4c19-81c5-bbf94a040c9a'
  AND is_active = true;
