GRANT DELETE ON public.programs TO authenticated;

ALTER TABLE public.workout_feedback
  DROP CONSTRAINT workout_feedback_program_id_fkey,
  ADD CONSTRAINT workout_feedback_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;