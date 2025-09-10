-- Security Fix: Tighten guest verification token access
-- Drop all existing overly permissive policies
DROP POLICY IF EXISTS "Allow secure token verification" ON guest_verification_tokens;
DROP POLICY IF EXISTS "Admins can view limited guest verification data" ON guest_verification_tokens;
DROP POLICY IF EXISTS "Allow secure token operations" ON guest_verification_tokens;

-- Create a single, strict policy for guest verification tokens
CREATE POLICY "Secure guest verification access only" ON guest_verification_tokens
  FOR SELECT 
  USING (
    -- Only service role for system operations
    (auth.role() = 'service_role'::text) OR
    -- Only verified admin users with active sessions
    (EXISTS (
      SELECT 1 
      FROM admin_sessions s
      JOIN admin_users u ON s.admin_user_id = u.id
      WHERE s.admin_user_id = auth.uid() 
      AND s.expires_at > now() 
      AND u.role = 'admin'::admin_role 
      AND u.is_active = true
    ))
  );

-- Ensure only service role can update/insert/delete
CREATE POLICY "Service role only modifications" ON guest_verification_tokens
  FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Tighten data deletion request access - only DPO should see personal data
DROP POLICY IF EXISTS "DPO only can view deletion requests" ON data_deletion_requests;

CREATE POLICY "Strict DPO access to deletion requests" ON data_deletion_requests
  FOR SELECT 
  USING (
    (auth.role() = 'service_role'::text) OR
    (EXISTS (
      SELECT 1 
      FROM admin_sessions s
      JOIN admin_users u ON s.admin_user_id = u.id
      WHERE s.admin_user_id = auth.uid() 
      AND s.expires_at > now() 
      AND u.role = 'admin'::admin_role 
      AND u.is_active = true
      AND u.is_data_protection_officer = true
    ))
  );

-- Add security audit logging
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (event_type, details)
  VALUES (
    'sensitive_data_access',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'admin_user_id', auth.uid(),
      'ip_address', inet_client_addr(),
      'timestamp', now(),
      'operation', TG_OP
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for audit logging on sensitive tables
CREATE TRIGGER audit_guest_verification_access
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON guest_verification_tokens
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_access();

CREATE TRIGGER audit_deletion_request_access
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON data_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_access();

-- Log the security hardening
INSERT INTO public.audit_logs (event_type, details)
VALUES (
  'security_hardening_applied',
  jsonb_build_object(
    'changes', ARRAY[
      'Tightened guest verification token access',
      'Restricted deletion request access to DPO only',
      'Added comprehensive audit logging for sensitive data access'
    ],
    'timestamp', now()
  )
);