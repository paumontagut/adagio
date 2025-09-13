-- Separar datos de identidad de datos de grabación para mejor privacidad
-- 1. Agregar session_pseudonym a la tabla recordings para separación de datos
ALTER TABLE public.recordings 
ADD COLUMN IF NOT EXISTS session_pseudonym text;

-- 2. Crear índice para búsquedas eficientes por pseudónimo
CREATE INDEX IF NOT EXISTS idx_recordings_session_pseudonym 
ON public.recordings(session_pseudonym);

-- 3. Crear función para generar pseudónimos consistentes
CREATE OR REPLACE FUNCTION public.get_or_create_pseudonym(original_session_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  existing_pseudonym text;
  new_pseudonym text;
BEGIN
  -- Buscar si ya existe un pseudónimo para este session_id
  SELECT session_pseudonym INTO existing_pseudonym
  FROM session_mapping
  WHERE encrypted_session_id = encode(digest(original_session_id, 'sha256'), 'hex')::bytea
  LIMIT 1;
  
  IF existing_pseudonym IS NOT NULL THEN
    RETURN existing_pseudonym;
  END IF;
  
  -- Generar nuevo pseudónimo si no existe
  new_pseudonym := generate_pseudonym(original_session_id);
  
  -- Guardar el mapeo
  INSERT INTO session_mapping (
    session_pseudonym,
    encrypted_session_id,
    mapping_iv,
    mapping_salt
  ) VALUES (
    new_pseudonym,
    encode(digest(original_session_id, 'sha256'), 'hex')::bytea,
    gen_random_bytes(12),
    gen_random_bytes(16)
  ) ON CONFLICT DO NOTHING;
  
  RETURN new_pseudonym;
END;
$$;

-- 4. Actualizar registros existentes en recordings para incluir pseudónimos
UPDATE public.recordings 
SET session_pseudonym = public.get_or_create_pseudonym(COALESCE(session_id, 'guest_' || id::text))
WHERE session_pseudonym IS NULL AND session_id IS NOT NULL;

-- 5. Crear trigger para asegurar que nuevas grabaciones tengan pseudónimo
CREATE OR REPLACE FUNCTION public.ensure_recording_pseudonym()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Si no tiene pseudónimo pero tiene session_id, generar uno
  IF NEW.session_pseudonym IS NULL AND NEW.session_id IS NOT NULL THEN
    NEW.session_pseudonym := public.get_or_create_pseudonym(NEW.session_id);
  END IF;
  
  -- Si no tiene session_id ni pseudónimo, generar basado en el ID
  IF NEW.session_pseudonym IS NULL AND NEW.session_id IS NULL THEN
    NEW.session_pseudonym := public.get_or_create_pseudonym('guest_' || NEW.id::text);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_ensure_recording_pseudonym ON public.recordings;
CREATE TRIGGER trigger_ensure_recording_pseudonym
  BEFORE INSERT OR UPDATE ON public.recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_recording_pseudonym();

-- 6. Crear vista para admin que separa claramente los datos
CREATE OR REPLACE VIEW public.admin_recordings_view AS
SELECT 
  r.id,
  r.session_pseudonym,
  r.phrase_text,
  r.audio_url,
  r.duration_ms,
  r.sample_rate,
  r.format,
  r.consent_train,
  r.consent_store,
  r.device_label,
  r.created_at,
  r.consent_at,
  -- NO incluir full_name directamente para separación de datos
  CASE 
    WHEN r.session_pseudonym IS NOT NULL THEN '***' 
    ELSE NULL 
  END as identity_available
FROM public.recordings r;

-- 7. Crear función admin para obtener datos de identidad por separado (solo cuando sea necesario)
CREATE OR REPLACE FUNCTION public.admin_get_identity_for_pseudonym(
  pseudonym text,
  admin_session_token text
)
RETURNS TABLE(
  session_pseudonym text,
  email text,
  full_name text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Validar sesión admin
  SELECT s.admin_user_id INTO admin_user_id
  FROM admin_sessions s
  JOIN admin_users u ON s.admin_user_id = u.id
  WHERE s.session_token = admin_session_token 
  AND s.expires_at > now() 
  AND u.role IN ('admin', 'analyst')
  AND u.is_active = true;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid admin session for identity lookup';
  END IF;

  -- Log el acceso a datos de identidad
  INSERT INTO public.audit_logs (event_type, details)
  VALUES (
    'admin_identity_lookup',
    jsonb_build_object(
      'admin_user_id', admin_user_id,
      'pseudonym_accessed', pseudonym,
      'timestamp', now()
    )
  );

  -- Devolver datos de identidad SOLO para el pseudónimo específico
  RETURN QUERY
  SELECT 
    gvt.session_pseudonym,
    gvt.email,
    gvt.full_name,
    gvt.created_at
  FROM guest_verification_tokens gvt
  WHERE gvt.session_pseudonym = pseudonym;
END;
$$;

-- 8. Log de la separación de datos
INSERT INTO public.audit_logs (event_type, details)
VALUES (
  'data_separation_implemented',
  jsonb_build_object(
    'description', 'Separated identity data from recording data for privacy',
    'changes', ARRAY[
      'Added session_pseudonym to recordings table',
      'Created pseudonym generation functions',
      'Created admin_recordings_view without direct identity data',
      'Created separate identity lookup function with audit logging'
    ],
    'timestamp', now()
  )
);