-- Tipo de rol admin
CREATE TYPE public.admin_role AS ENUM ('admin', 'viewer', 'analyst');

-- Tabla de usuarios admin
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de sesiones admin
CREATE TABLE public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de logs de actividad
CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de auditoría
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para service_role
CREATE POLICY "Service role full access admin_users"
ON public.admin_users FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access admin_sessions"
ON public.admin_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access admin_activity_log"
ON public.admin_activity_log FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access audit_logs"
ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Función de validación de login admin
CREATE OR REPLACE FUNCTION public.validate_admin_login(login_email text, login_password text)
RETURNS TABLE(admin_user_id uuid, admin_email text, admin_full_name text, admin_role admin_role, session_token text, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  admin_record public.admin_users;
  auth_user_record record;
  new_token TEXT;
  new_expires_at TIMESTAMPTZ;
BEGIN
  -- Buscar usuario admin activo
  SELECT * INTO admin_record 
  FROM public.admin_users 
  WHERE email = login_email AND is_active = true;
  
  IF NOT FOUND THEN RETURN; END IF;
  
  -- Validar contraseña contra auth.users
  SELECT * INTO auth_user_record
  FROM auth.users
  WHERE email = login_email 
  AND encrypted_password = crypt(login_password, encrypted_password);
  
  IF NOT FOUND THEN RETURN; END IF;
  
  -- Generar token de sesión
  new_token := encode(extensions.digest(
    convert_to(admin_record.id::text || extract(epoch from now())::text || random()::text, 'UTF8'),
    'sha256'
  ), 'hex');
  
  new_expires_at := now() + '4 hours'::interval;
  
  -- Crear sesión
  INSERT INTO public.admin_sessions (admin_user_id, session_token, expires_at)
  VALUES (admin_record.id, new_token, new_expires_at);
  
  -- Actualizar último login
  UPDATE public.admin_users SET last_login = now() WHERE id = admin_record.id;
  
  RETURN QUERY SELECT admin_record.id, admin_record.email, admin_record.full_name, admin_record.role, new_token, new_expires_at;
END;
$$;

-- Función de validación de sesión admin
CREATE OR REPLACE FUNCTION public.validate_admin_session(token TEXT)
RETURNS TABLE (admin_user_id uuid, admin_email text, admin_full_name text, admin_role admin_role, is_active boolean)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.full_name, u.role, u.is_active
  FROM public.admin_users u
  JOIN public.admin_sessions s ON s.admin_user_id = u.id
  WHERE s.session_token = token 
  AND s.expires_at > now()
  AND u.is_active = true;
END;
$$;

-- Función para invalidar sesión
CREATE OR REPLACE FUNCTION public.invalidate_admin_session(token TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.admin_sessions WHERE session_token = token;
END;
$$;