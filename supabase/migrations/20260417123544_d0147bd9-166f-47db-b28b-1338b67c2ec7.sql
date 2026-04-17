-- 1. Tabla user_consents
CREATE TABLE public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  privacy_policy BOOLEAN NOT NULL DEFAULT false,
  terms_and_conditions BOOLEAN NOT NULL DEFAULT false,
  data_use_consent BOOLEAN NOT NULL DEFAULT false,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents"
  ON public.user_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
  ON public.user_consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consents"
  ON public.user_consents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own consents"
  ON public.user_consents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_user_consents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_consents_updated_at_trigger
BEFORE UPDATE ON public.user_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_user_consents_updated_at();

-- 2. Columna audio_path en transcriptions
ALTER TABLE public.transcriptions
ADD COLUMN audio_path TEXT;

-- 3. Bucket privado inferencias
INSERT INTO storage.buckets (id, name, public)
VALUES ('inferencias', 'inferencias', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policies: cada usuario solo en su carpeta {user_id}/...
CREATE POLICY "Users can upload own inference audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inferencias'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own inference audio"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'inferencias'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own inference audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'inferencias'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );