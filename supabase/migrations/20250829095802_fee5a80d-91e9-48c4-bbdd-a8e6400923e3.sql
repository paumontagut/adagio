-- Crear tabla de grabaciones para usuarios autenticados e invitados
CREATE TABLE public.recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  phrase_text text,
  audio_url text NOT NULL,
  duration_ms integer,
  sample_rate integer,
  format text DEFAULT 'webm',
  device_label text,
  consent_train boolean DEFAULT false,
  consent_store boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver solo sus grabaciones
CREATE POLICY "users_select_own" 
ON public.recordings 
FOR SELECT 
USING (user_id = auth.uid());

-- Política: Los usuarios pueden insertar grabaciones (como autenticado o invitado)
CREATE POLICY "users_insert_self_or_guest" 
ON public.recordings 
FOR INSERT 
WITH CHECK (user_id = auth.uid() OR (user_id IS NULL AND session_id IS NOT NULL));

-- Política: Los usuarios pueden actualizar solo sus grabaciones
CREATE POLICY "users_update_own" 
ON public.recordings 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Política: Los usuarios pueden eliminar solo sus grabaciones
CREATE POLICY "users_delete_own" 
ON public.recordings 
FOR DELETE 
USING (user_id = auth.uid());

-- Crear índices para mejor rendimiento
CREATE INDEX idx_recordings_user_id ON public.recordings(user_id);
CREATE INDEX idx_recordings_session_id ON public.recordings(session_id);
CREATE INDEX idx_recordings_created_at ON public.recordings(created_at DESC);