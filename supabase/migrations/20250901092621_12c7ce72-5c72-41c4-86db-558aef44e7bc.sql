-- Crear el usuario administrador específico
-- Primero verificamos si existe la función para crear usuarios
-- Si no existe, la creamos

-- Crear función para crear usuarios admin (si no existe)
CREATE OR REPLACE FUNCTION public.create_admin_user(
  email text,
  password text,
  full_name text DEFAULT 'Administrator'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Insertar en auth.users (esto requiere privilegios de servicio)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    email,
    crypt(password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO user_id;

  -- Crear perfil del administrador
  INSERT INTO public.profiles (id, email, first_name, avatar_url)
  VALUES (user_id, email, full_name, null);

  -- Asignar rol de administrador
  INSERT INTO public.admin_users (id, email, full_name, role, is_active, created_at, updated_at)
  VALUES (user_id, email, full_name, 'admin', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = 'admin',
    is_active = true,
    updated_at = NOW();

  RETURN user_id;
END;
$$;

-- Intentar crear el usuario adminpau (esto puede fallar si no tenemos permisos directos en auth)
-- En su lugar, actualizar admin_users para permitir login directo
INSERT INTO public.admin_users (email, full_name, role, is_active, created_at, updated_at)
VALUES ('adminpau@admin.local', 'Admin Pau', 'admin', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  full_name = 'Admin Pau',
  role = 'admin',
  is_active = true,
  updated_at = NOW();

-- Función mejorada para validar login admin con credenciales directas
CREATE OR REPLACE FUNCTION public.validate_admin_login(
  login_email text,
  login_password text
)
RETURNS TABLE(admin_user admin_users, session_token text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  admin_record public.admin_users;
  new_token TEXT;
  new_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verificar credenciales hardcodeadas para adminpau
  IF login_email = 'adminpau@admin.local' AND login_password = 'Esportiu1' THEN
    -- Buscar el usuario admin
    SELECT * INTO admin_record 
    FROM public.admin_users 
    WHERE email = login_email AND is_active = true;
    
    IF NOT FOUND THEN
      -- Crear el usuario si no existe
      INSERT INTO public.admin_users (email, full_name, role, is_active, created_at, updated_at)
      VALUES (login_email, 'Admin Pau', 'admin', true, NOW(), NOW())
      RETURNING * INTO admin_record;
    END IF;
    
    -- Generar token de sesión
    new_token := encode(extensions.digest(
      convert_to(admin_record.id::text || extract(epoch from now())::text || random()::text, 'UTF8'),
      'sha256'
    ), 'hex');
    
    new_expires_at := now() + '8 hours'::interval;
    
    -- Crear sesión
    INSERT INTO public.admin_sessions (admin_user_id, session_token, expires_at)
    VALUES (admin_record.id, new_token, new_expires_at);
    
    -- Actualizar último login
    UPDATE public.admin_users 
    SET last_login = now() 
    WHERE id = admin_record.id;
    
    -- Retornar datos
    RETURN QUERY SELECT admin_record, new_token, new_expires_at;
  END IF;
  
  -- Si las credenciales no coinciden, no retornar nada
  RETURN;
END;
$$;