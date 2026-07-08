
-- Make exercise-videos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'exercise-videos';

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Anyone can view exercise videos" ON storage.objects;

-- Create new policy requiring authentication
CREATE POLICY "Authenticated users can view exercise videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'exercise-videos');
