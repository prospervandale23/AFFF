-- Drop overly broad SELECT policies that allow anonymous listing of all bucket files.
-- Public bucket URLs remain accessible to everyone — only enumeration is restricted.
DROP POLICY IF EXISTS "Anyone can view chat photos"    ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "lure-photos select 1298p2q_0"  ON storage.objects;
DROP POLICY IF EXISTS "lure-photos update 1298p2q_1"  ON storage.objects;

-- profile-photos: authenticated users can list files (public URLs still work for everyone)
CREATE POLICY "Authenticated users can list profile photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'profile-photos');

-- chat-photos: authenticated users can list their own uploads only
CREATE POLICY "Authenticated users can list own chat photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- lure-photos: authenticated users can list all lure photos (public catalog)
CREATE POLICY "Authenticated users can list lure photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'lure-photos');
