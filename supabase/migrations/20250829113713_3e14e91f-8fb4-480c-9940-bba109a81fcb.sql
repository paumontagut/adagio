-- Create admin users and roles system
CREATE TYPE public.admin_role AS ENUM ('admin', 'viewer', 'analyst');

-- Admin users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.admin_users(id)
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admin sessions table
CREATE TABLE public.admin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Admin activity log
CREATE TABLE public.admin_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view admin users" ON public.admin_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions s 
    WHERE s.admin_user_id = auth.uid() 
    AND s.expires_at > now()
  )
);

CREATE POLICY "Admins can manage users based on role" ON public.admin_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions s
    JOIN public.admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid()
    AND s.expires_at > now()
    AND u.role = 'admin'
  )
);

-- Admin sessions policies
CREATE POLICY "Users can view own sessions" ON public.admin_sessions
FOR SELECT USING (admin_user_id = auth.uid());

CREATE POLICY "Users can insert own sessions" ON public.admin_sessions
FOR INSERT WITH CHECK (admin_user_id = auth.uid());

-- Activity log policies
CREATE POLICY "Admins can view activity logs" ON public.admin_activity_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions s
    JOIN public.admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid()
    AND s.expires_at > now()
    AND u.role IN ('admin', 'analyst')
  )
);

CREATE POLICY "System can insert activity logs" ON public.admin_activity_log
FOR INSERT WITH CHECK (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create default admin user (you'll need to update the email)
INSERT INTO public.admin_users (email, full_name, role, is_active)
VALUES ('admin@example.com', 'System Administrator', 'admin', true);

-- Function to create admin session
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

-- Function to validate admin session
CREATE OR REPLACE FUNCTION public.validate_admin_session(token TEXT)
RETURNS TABLE (admin_user admin_users)
LANGUAGE plpgsql
SECURITY DEFINER
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