-- 1. Ampliar tabla transcriptions
ALTER TABLE public.transcriptions
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS audio_format TEXT,
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS original_text TEXT,
  ADD COLUMN IF NOT EXISTS corrected_text TEXT,
  ADD COLUMN IF NOT EXISTS is_validated BOOLEAN,
  ADD COLUMN IF NOT EXISTS feedback_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Permitir UPDATE por el dueño
DROP POLICY IF EXISTS "Users can update own transcriptions" ON public.transcriptions;
CREATE POLICY "Users can update own transcriptions"
  ON public.transcriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_transcriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transcriptions_updated_at ON public.transcriptions;
CREATE TRIGGER trg_transcriptions_updated_at
  BEFORE UPDATE ON public.transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transcriptions_updated_at();

-- 4. Índice por user/fecha
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_created
  ON public.transcriptions (user_id, created_at DESC);

-- 5. Bucket privado nuevo
INSERT INTO storage.buckets (id, name, public)
VALUES ('transcripciones', 'transcripciones', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Políticas RLS para el bucket (carpeta = user_id)
DROP POLICY IF EXISTS "Users can read own transcripciones audio" ON storage.objects;
CREATE POLICY "Users can read own transcripciones audio"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'transcripciones' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload own transcripciones audio" ON storage.objects;
CREATE POLICY "Users can upload own transcripciones audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'transcripciones' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own transcripciones audio" ON storage.objects;
CREATE POLICY "Users can delete own transcripciones audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'transcripciones' AND auth.uid()::text = (storage.foldername(name))[1]);