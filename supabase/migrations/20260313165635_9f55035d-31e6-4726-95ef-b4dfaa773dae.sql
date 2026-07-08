-- Migrate the assignment from incomplete duplicate to the complete Perform 2.1
UPDATE public.program_assignments 
SET program_id = '468bd5d2-b8dc-439d-a847-bb006427a302'
WHERE id = '7037d470-40c5-43cb-b559-2b1d1c614585';

-- Delete program_days for incomplete duplicates
DELETE FROM public.program_days WHERE program_id = '5a6b912a-e0de-482b-bda2-cf1fd0774098';
DELETE FROM public.program_days WHERE program_id = 'c8376bf5-dffb-4201-a5e9-80ea5f724694';

-- Delete the incomplete duplicate programs
DELETE FROM public.programs WHERE id = '5a6b912a-e0de-482b-bda2-cf1fd0774098';
DELETE FROM public.programs WHERE id = 'c8376bf5-dffb-4201-a5e9-80ea5f724694';