-- Fix critical security vulnerabilities: Restrict access to sensitive data tables

-- 1. Fix consent_logs table - remove public access
DROP POLICY IF EXISTS "Public consent logs access" ON public.consent_logs;

-- Create secure policies for consent_logs
CREATE POLICY "System processes can manage consent logs" 
ON public.consent_logs 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view consent logs" 
ON public.consent_logs 
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

-- 2. Fix audio_metadata table - remove public read access
DROP POLICY IF EXISTS "Public can read audio metadata" ON public.audio_metadata;
DROP POLICY IF EXISTS "Can insert own audio metadata" ON public.audio_metadata;

-- Create secure policies for audio_metadata
CREATE POLICY "System processes can manage audio metadata" 
ON public.audio_metadata 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view audio metadata" 
ON public.audio_metadata 
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

-- 3. Fix encrypted_audio_files table - restrict to system processes only
DROP POLICY IF EXISTS "Can access own encrypted files" ON public.encrypted_audio_files;

-- Create secure policies for encrypted_audio_files
CREATE POLICY "System processes can manage encrypted files" 
ON public.encrypted_audio_files 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 4. Fix session_mapping table - already restricted but ensure proper access
DROP POLICY IF EXISTS "System can access session mapping" ON public.session_mapping;

-- Create secure policies for session_mapping
CREATE POLICY "System processes can manage session mapping" 
ON public.session_mapping 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 5. Fix data_deletion_requests table - restrict public read access
DROP POLICY IF EXISTS "Can read own deletion requests" ON public.data_deletion_requests;
DROP POLICY IF EXISTS "Public can create deletion requests" ON public.data_deletion_requests;
DROP POLICY IF EXISTS "System can manage deletion requests" ON public.data_deletion_requests;

-- Create secure policies for data_deletion_requests
CREATE POLICY "Users can create deletion requests" 
ON public.data_deletion_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System processes can manage deletion requests" 
ON public.data_deletion_requests 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view deletion requests" 
ON public.data_deletion_requests 
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

-- Log the security fixes
INSERT INTO public.audit_logs (event_type, details)
VALUES (
  'critical_security_fixes_applied',
  jsonb_build_object(
    'fixes_applied', ARRAY[
      'consent_logs_access_restricted',
      'audio_metadata_access_restricted', 
      'encrypted_audio_files_access_restricted',
      'session_mapping_access_restricted',
      'data_deletion_requests_access_restricted'
    ],
    'description', 'Removed public access to sensitive data tables, restricted to system processes and admin users only',
    'timestamp', now()
  )
);