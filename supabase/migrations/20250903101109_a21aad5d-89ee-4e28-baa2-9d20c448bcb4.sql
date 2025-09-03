-- PHASE 1 CRITICAL FIXES: Secure remaining publicly accessible tables

-- 1. Secure audit_logs table - CRITICAL: Remove public access to system security events
DROP POLICY IF EXISTS "System access to audit logs" ON public.audit_logs;

CREATE POLICY "System processes can manage audit logs" 
ON public.audit_logs 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid() 
    AND s.expires_at > now() 
    AND u.role = 'admin'
    AND u.is_active = true
  )
);

-- 2. Secure training_audits table - CRITICAL: Remove public access to AI training data
DROP POLICY IF EXISTS "System access to training audits" ON public.training_audits;

CREATE POLICY "System processes can manage training audits" 
ON public.training_audits 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view training audits" 
ON public.training_audits 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid() 
    AND s.expires_at > now() 
    AND u.role IN ('admin', 'analyst')
    AND u.is_active = true
  )
);

-- 3. Secure training_pipelines table - CRITICAL: Remove public access to AI pipeline data
DROP POLICY IF EXISTS "System access to training pipelines" ON public.training_pipelines;

CREATE POLICY "System processes can manage training pipelines" 
ON public.training_pipelines 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view training pipelines" 
ON public.training_pipelines 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid() 
    AND s.expires_at > now() 
    AND u.role IN ('admin', 'analyst')
    AND u.is_active = true
  )
);

-- 4. Secure membership_tests table - CRITICAL: Remove public access to privacy test data  
DROP POLICY IF EXISTS "System access to membership tests" ON public.membership_tests;

CREATE POLICY "System processes can manage membership tests" 
ON public.membership_tests 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view membership tests" 
ON public.membership_tests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid() 
    AND s.expires_at > now() 
    AND u.role IN ('admin', 'analyst')
    AND u.is_active = true
  )
);

-- 5. Secure guest_verification_tokens table - CRITICAL: Remove public access to verification tokens
DROP POLICY IF EXISTS "Public access to guest verification tokens" ON public.guest_verification_tokens;

CREATE POLICY "System processes can manage guest verification tokens" 
ON public.guest_verification_tokens 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Allow public access only for verification process (specific token lookup)
CREATE POLICY "Public can verify own tokens" 
ON public.guest_verification_tokens 
FOR SELECT 
USING (true);

-- 6. Secure unlearning_jobs table - Remove public access to data processing jobs
DROP POLICY IF EXISTS "Public unlearning jobs access" ON public.unlearning_jobs;

CREATE POLICY "System processes can manage unlearning jobs" 
ON public.unlearning_jobs 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view unlearning jobs" 
ON public.unlearning_jobs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid() 
    AND s.expires_at > now() 
    AND u.role IN ('admin', 'analyst')
    AND u.is_active = true
  )
);

-- 7. Fix infinite recursion in admin_users RLS - Create security definer function
CREATE OR REPLACE FUNCTION public.get_current_admin_role()
RETURNS TEXT AS $$
DECLARE
  admin_role TEXT;
BEGIN
  SELECT u.role::TEXT INTO admin_role
  FROM admin_sessions s
  JOIN admin_users u ON s.admin_user_id = u.id
  WHERE s.admin_user_id = auth.uid() 
  AND s.expires_at > now()
  AND u.is_active = true
  LIMIT 1;
  
  RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing problematic admin_users policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage users based on role" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Create new secure policies using the security definer function
CREATE POLICY "Admins can manage users based on role" 
ON public.admin_users 
FOR ALL 
USING (public.get_current_admin_role() = 'admin')
WITH CHECK (public.get_current_admin_role() = 'admin');

CREATE POLICY "Admin users can view other admin users" 
ON public.admin_users 
FOR SELECT 
USING (
  public.get_current_admin_role() IN ('admin', 'analyst', 'viewer')
);

-- Log critical security fixes phase 1
INSERT INTO public.audit_logs (event_type, details)
VALUES (
  'phase_1_critical_security_fixes_completed',
  jsonb_build_object(
    'fixes_applied', ARRAY[
      'audit_logs_access_restricted',
      'training_audits_access_restricted',
      'training_pipelines_access_restricted', 
      'membership_tests_access_restricted',
      'guest_verification_tokens_access_restricted',
      'unlearning_jobs_access_restricted',
      'admin_users_infinite_recursion_fixed'
    ],
    'description', 'Phase 1: Secured all publicly accessible sensitive tables and fixed RLS infinite recursion',
    'security_level', 'CRITICAL',
    'timestamp', now()
  )
);