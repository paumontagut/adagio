-- Security Fix: Remove hardcoded admin credentials and improve authentication
-- Replace the hardcoded admin login function with proper credential validation
DROP FUNCTION IF EXISTS public.validate_admin_login(text, text);

-- Create a more secure admin login function that uses proper password hashing
CREATE OR REPLACE FUNCTION public.validate_admin_login(login_email text, login_password text)
RETURNS TABLE(admin_user admin_users, session_token text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  admin_record public.admin_users;
  auth_user_record record;
  new_token TEXT;
  new_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Look up the admin user first
  SELECT * INTO admin_record 
  FROM public.admin_users 
  WHERE email = login_email AND is_active = true;
  
  IF NOT FOUND THEN
    -- Log failed login attempt
    INSERT INTO public.audit_logs (event_type, details)
    VALUES (
      'admin_login_failed',
      jsonb_build_object(
        'email', login_email,
        'reason', 'user_not_found',
        'ip_address', inet_client_addr(),
        'timestamp', now()
      )
    );
    RETURN;
  END IF;
  
  -- Validate password against auth.users table
  SELECT * INTO auth_user_record
  FROM auth.users
  WHERE email = login_email 
  AND encrypted_password = crypt(login_password, encrypted_password);
  
  IF NOT FOUND THEN
    -- Log failed login attempt
    INSERT INTO public.audit_logs (event_type, details)
    VALUES (
      'admin_login_failed',
      jsonb_build_object(
        'email', login_email,
        'admin_user_id', admin_record.id,
        'reason', 'invalid_password',
        'ip_address', inet_client_addr(),
        'timestamp', now()
      )
    );
    RETURN;
  END IF;
  
  -- Generate secure session token
  new_token := encode(extensions.digest(
    convert_to(admin_record.id::text || extract(epoch from now())::text || random()::text, 'UTF8'),
    'sha256'
  ), 'hex');
  
  new_expires_at := now() + '4 hours'::interval; -- Reduced from 8 hours for better security
  
  -- Create session
  INSERT INTO public.admin_sessions (admin_user_id, session_token, expires_at, ip_address)
  VALUES (admin_record.id, new_token, new_expires_at, inet_client_addr());
  
  -- Update last login and log successful login
  UPDATE public.admin_users 
  SET last_login = now() 
  WHERE id = admin_record.id;
  
  INSERT INTO public.audit_logs (event_type, details)
  VALUES (
    'admin_login_successful',
    jsonb_build_object(
      'admin_user_id', admin_record.id,
      'email', login_email,
      'session_expires', new_expires_at,
      'ip_address', inet_client_addr(),
      'timestamp', now()
    )
  );
  
  -- Return session info
  RETURN QUERY SELECT admin_record, new_token, new_expires_at;
END;
$$;

-- Add function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.admin_sessions 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  INSERT INTO public.audit_logs (event_type, details)
  VALUES (
    'expired_sessions_cleaned',
    jsonb_build_object(
      'deleted_sessions', deleted_count,
      'timestamp', now()
    )
  );
  
  RETURN deleted_count;
END;
$$;

-- Add session timeout validation function
CREATE OR REPLACE FUNCTION public.extend_admin_session(session_token text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_record public.admin_sessions;
BEGIN
  -- Find the session
  SELECT * INTO session_record
  FROM public.admin_sessions
  WHERE session_token = session_token
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Extend session by 4 hours from now
  UPDATE public.admin_sessions
  SET expires_at = now() + '4 hours'::interval
  WHERE session_token = session_token;
  
  RETURN TRUE;
END;
$$;