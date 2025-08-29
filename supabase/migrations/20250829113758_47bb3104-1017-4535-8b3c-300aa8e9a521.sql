-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.create_admin_session(
  admin_email TEXT,
  session_duration_hours INTEGER DEFAULT 8
)
RETURNS TABLE (
  session_token TEXT,
  admin_user admin_users,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'
AS $$
DECLARE
  admin_record public.admin_users;
  new_token TEXT;
  new_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find admin user
  SELECT * INTO admin_record 
  FROM public.admin_users 
  WHERE email = admin_email AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin user not found or inactive';
  END IF;
  
  -- Generate session token
  new_token := encode(extensions.digest(
    convert_to(admin_record.id::text || extract(epoch from now())::text || random()::text, 'UTF8'),
    'sha256'
  ), 'hex');
  
  new_expires_at := now() + (session_duration_hours || ' hours')::interval;
  
  -- Create session
  INSERT INTO public.admin_sessions (admin_user_id, session_token, expires_at)
  VALUES (admin_record.id, new_token, new_expires_at);
  
  -- Update last login
  UPDATE public.admin_users 
  SET last_login = now() 
  WHERE id = admin_record.id;
  
  -- Return session info
  RETURN QUERY SELECT new_token, admin_record, new_expires_at;
END;
$$;

-- Fix validate_admin_session function
CREATE OR REPLACE FUNCTION public.validate_admin_session(token TEXT)
RETURNS TABLE (admin_user admin_users)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_record public.admin_sessions;
  admin_record public.admin_users;
BEGIN
  -- Find valid session
  SELECT s.* INTO session_record
  FROM public.admin_sessions s
  WHERE s.session_token = token 
  AND s.expires_at > now();
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get admin user
  SELECT u.* INTO admin_record
  FROM public.admin_users u
  WHERE u.id = session_record.admin_user_id
  AND u.is_active = true;
  
  IF FOUND THEN
    RETURN QUERY SELECT admin_record;
  END IF;
END;
$$;