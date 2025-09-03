-- Fix critical security vulnerability: Restrict access to encryption key tables

-- Drop overly permissive policies on encryption_keys table
DROP POLICY IF EXISTS "System can manage encryption keys" ON public.encryption_keys;

-- Create secure policies for encryption_keys table
-- Only service role (edge functions) can access
CREATE POLICY "Service role can manage encryption keys" 
ON public.encryption_keys 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Admin users can only view encryption key metadata (not the actual keys)
CREATE POLICY "Admins can view encryption key metadata" 
ON public.encryption_keys 
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

-- Drop overly permissive policies on storage_keys table
DROP POLICY IF EXISTS "System access to storage keys" ON public.storage_keys;

-- Create secure policies for storage_keys table
-- Only service role (edge functions) can access
CREATE POLICY "Service role can manage storage keys" 
ON public.storage_keys 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Admin users can only view storage key metadata (not the actual keys)
CREATE POLICY "Admins can view storage key metadata" 
ON public.storage_keys 
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

-- Log the security fix
INSERT INTO public.audit_logs (event_type, details)
VALUES (
  'security_fix_applied',
  jsonb_build_object(
    'issue', 'encryption_keys_publicly_readable',
    'fix', 'restricted_access_to_service_role_and_admins',
    'tables_affected', ARRAY['encryption_keys', 'storage_keys'],
    'timestamp', now()
  )
);