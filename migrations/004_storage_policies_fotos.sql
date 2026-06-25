-- Políticas para el bucket 'fotos' en Supabase Storage
-- Ejecutar en el SQL Editor de Supabase

CREATE POLICY "Public SELECT fotos"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos');

CREATE POLICY "Public INSERT fotos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fotos');

CREATE POLICY "Public UPDATE fotos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fotos')
WITH CHECK (bucket_id = 'fotos');

CREATE POLICY "Public DELETE fotos"
ON storage.objects FOR DELETE
USING (bucket_id = 'fotos');
