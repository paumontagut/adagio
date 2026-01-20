-- Tabla para claves de cifrado
CREATE TABLE public.encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL UNIQUE,
  key_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Insertar clave inicial activa
INSERT INTO public.encryption_keys (version, key_hash, is_active)
VALUES (1, 'initial_key_hash_32bytes_padding', true);

-- Tabla para mapeo de sesiones
CREATE TABLE public.session_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_pseudonym TEXT NOT NULL UNIQUE,
  encrypted_session_id BYTEA,
  mapping_iv BYTEA,
  mapping_salt BYTEA,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para metadatos de audio
CREATE TABLE public.audio_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_pseudonym TEXT NOT NULL,
  phrase_text TEXT,
  duration_ms INTEGER,
  sample_rate INTEGER,
  audio_format TEXT,
  device_info TEXT,
  quality_score DECIMAL,
  consent_train BOOLEAN DEFAULT false,
  consent_store BOOLEAN DEFAULT false,
  encryption_key_version INTEGER,
  unencrypted_file_path TEXT,
  unencrypted_storage_bucket TEXT,
  unencrypted_file_size_bytes BIGINT,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para archivos de audio cifrados
CREATE TABLE public.encrypted_audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metadata_id UUID REFERENCES public.audio_metadata(id) ON DELETE CASCADE,
  encrypted_blob TEXT,
  iv TEXT,
  salt TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para grabaciones de usuarios
CREATE TABLE public.recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  phrase_text TEXT,
  audio_url TEXT,
  duration_ms INTEGER,
  sample_rate INTEGER,
  format TEXT,
  device_label TEXT,
  consent_train BOOLEAN DEFAULT false,
  consent_store BOOLEAN DEFAULT false,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para service_role (edge functions)
CREATE POLICY "Service role full access encryption_keys"
ON public.encryption_keys FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access session_mapping"
ON public.session_mapping FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access audio_metadata"
ON public.audio_metadata FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access encrypted_audio_files"
ON public.encrypted_audio_files FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access recordings"
ON public.recordings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Usuarios pueden ver sus propias grabaciones
CREATE POLICY "Users can view own recordings"
ON public.recordings FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recordings"
ON public.recordings FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());