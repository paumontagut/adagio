-- Separar datos de identidad - versión simplificada
-- 1. Agregar session_pseudonym a la tabla recordings para separación de datos
ALTER TABLE public.recordings 
ADD COLUMN IF NOT EXISTS session_pseudonym text;

-- 2. Crear índice para búsquedas eficientes por pseudónimo
CREATE INDEX IF NOT EXISTS idx_recordings_session_pseudonym 
ON public.recordings(session_pseudonym);

-- 3. Función simplificada para generar pseudónimos usando función existente
CREATE OR REPLACE FUNCTION public.get_or_create_pseudonym_simple(original_session_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  existing_pseudonym text;
  new_pseudonym text;
BEGIN
  -- Buscar si ya existe un pseudónimo para este session_id en session_mapping
  SELECT session_pseudonym INTO existing_pseudonym
  FROM session_mapping
  WHERE session_pseudonym LIKE 'ps_%'
  AND last_accessed IS NOT NULL
  LIMIT 1;
  
  -- Si no encontramos uno existente, generar nuevo usando la función existente
  IF existing_pseudonym IS NULL THEN
    new_pseudonym := generate_pseudonym(original_session_id);
    RETURN new_pseudonym;
  END IF;
  
  RETURN existing_pseudonym;
END;
$$;

-- 4. Actualizar registros existentes en recordings para incluir pseudónimos
-- Solo actualizar si no tienen pseudónimo y tienen session_id
UPDATE public.recordings 
SET session_pseudonym = generate_pseudonym(COALESCE(session_id, 'guest_' || id::text))
WHERE session_pseudonym IS NULL;

-- 5. Crear trigger simplificado para asegurar que nuevas grabaciones tengan pseudónimo
CREATE OR REPLACE FUNCTION public.ensure_recording_pseudonym()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Si no tiene pseudónimo, generar uno
  IF NEW.session_pseudonym IS NULL THEN
    NEW.session_pseudonym := generate_pseudonym(COALESCE(NEW.session_id, 'guest_' || NEW.id::text));
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

-- 6. Crear función admin para obtener datos de identidad por separado con auditoría
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

-- Log de la separación de datos
INSERT INTO public.audit_logs (event_type, details)
VALUES (
  'data_separation_implemented',
  jsonb_build_object(
    'description', 'Added pseudonyms to recordings table for privacy separation',
    'changes', ARRAY[
      'Added session_pseudonym column to recordings table',
      'Created trigger to auto-generate pseudonyms',
      'Created identity lookup function with audit logging'
    ],
    'timestamp', now()
  )
);