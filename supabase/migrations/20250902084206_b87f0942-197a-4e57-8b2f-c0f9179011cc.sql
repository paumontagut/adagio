-- Agregar campos para almacenar referencias a ambas versiones de audio
ALTER TABLE public.audio_metadata 
ADD COLUMN IF NOT EXISTS unencrypted_file_path TEXT,
ADD COLUMN IF NOT EXISTS unencrypted_storage_bucket TEXT DEFAULT 'audio_raw',
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS unencrypted_file_size_bytes BIGINT;

-- Crear índice para búsquedas eficientes por bucket y archivo
CREATE INDEX IF NOT EXISTS idx_audio_metadata_unencrypted_path 
ON public.audio_metadata(unencrypted_storage_bucket, unencrypted_file_path) 
WHERE unencrypted_file_path IS NOT NULL;

-- Agregar comentarios para documentar los nuevos campos
COMMENT ON COLUMN public.audio_metadata.unencrypted_file_path IS 'Ruta del archivo de audio sin cifrar en Supabase Storage';
COMMENT ON COLUMN public.audio_metadata.unencrypted_storage_bucket IS 'Bucket de almacenamiento para el archivo sin cifrar';
COMMENT ON COLUMN public.audio_metadata.file_size_bytes IS 'Tamaño en bytes del archivo cifrado';
COMMENT ON COLUMN public.audio_metadata.unencrypted_file_size_bytes IS 'Tamaño en bytes del archivo sin cifrar';