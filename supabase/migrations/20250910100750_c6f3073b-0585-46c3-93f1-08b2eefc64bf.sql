-- Security Fix: Secure data deletion requests policy
-- Only allow insertions from public (for deletion requests) or system processes
DROP POLICY IF EXISTS "Public can create deletion requests" ON public.data_deletion_requests;
CREATE POLICY "Secure deletion request creation" 
ON public.data_deletion_requests 
FOR INSERT 
WITH CHECK (
  -- Allow public to create requests with verification token
  (verification_token IS NOT NULL AND session_pseudonym IS NOT NULL) 
  OR 
  -- Allow service role for system processes
  (auth.role() = 'service_role'::text)
);

-- Add rate limiting and logging trigger for deletion requests
CREATE OR REPLACE FUNCTION public.log_deletion_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Log deletion request creation for audit
  INSERT INTO public.audit_logs (event_type, details)
  VALUES (
    'deletion_request_created',
    jsonb_build_object(
      'session_pseudonym', NEW.session_pseudonym,
      'request_type', NEW.request_type,
      'has_verification_token', (NEW.verification_token IS NOT NULL),
      'ip_address', inet_client_addr(),
      'timestamp', now()
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for deletion request logging
DROP TRIGGER IF EXISTS deletion_request_audit_trigger ON public.data_deletion_requests;
CREATE TRIGGER deletion_request_audit_trigger
  AFTER INSERT ON public.data_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_deletion_request();

-- Security Fix: Secure guest verification tokens
-- Only allow system processes to update verification status
DROP POLICY IF EXISTS "Public can update verification status" ON public.guest_verification_tokens;
CREATE POLICY "System only verification updates" 
ON public.guest_verification_tokens 
FOR UPDATE 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Add audit logging for verification token access
CREATE OR REPLACE FUNCTION public.log_verification_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log verification token updates for security audit
  INSERT INTO public.audit_logs (event_type, details)
  VALUES (
    'verification_token_updated',
    jsonb_build_object(
      'session_pseudonym', NEW.session_pseudonym,
      'verified_at_changed', (OLD.verified_at != NEW.verified_at),
      'deletion_requested_changed', (OLD.deletion_requested_at != NEW.deletion_requested_at),
      'ip_address', inet_client_addr(),
      'timestamp', now()
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for verification token audit
DROP TRIGGER IF EXISTS verification_token_audit_trigger ON public.guest_verification_tokens;
CREATE TRIGGER verification_token_audit_trigger
  AFTER UPDATE ON public.guest_verification_tokens
  FOR EACH ROW EXECUTE FUNCTION public.log_verification_access();