-- Crear buckets de almacenamiento para imágenes y favicons
-- Nota: Los buckets se crean automáticamente cuando se sube el primer archivo,
-- pero esta migración asegura que existan con las políticas correctas

-- Bucket para imágenes de productos y logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para favicons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'favicons',
  'favicons',
  true,
  524288, -- 500KB
  ARRAY['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para el bucket 'images'
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public Access for images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete images" ON storage.objects;

-- Permitir lectura pública
CREATE POLICY "Public Access for images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Permitir inserción con service role (desde API routes con autenticación admin)
CREATE POLICY "Service role can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Permitir actualización con service role
CREATE POLICY "Service role can update images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images');

-- Permitir eliminación con service role
CREATE POLICY "Service role can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');

-- Políticas RLS para el bucket 'favicons'
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public Access for favicons" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload favicons" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update favicons" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete favicons" ON storage.objects;

-- Permitir lectura pública
CREATE POLICY "Public Access for favicons"
ON storage.objects FOR SELECT
USING (bucket_id = 'favicons');

-- Permitir inserción con service role
CREATE POLICY "Service role can upload favicons"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'favicons');

-- Permitir actualización con service role
CREATE POLICY "Service role can update favicons"
ON storage.objects FOR UPDATE
USING (bucket_id = 'favicons');

-- Permitir eliminación con service role
CREATE POLICY "Service role can delete favicons"
ON storage.objects FOR DELETE
USING (bucket_id = 'favicons');

