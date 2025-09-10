-- Fix guest verification system RLS policies (simplified approach)
-- Remove the blanket blocking policy and implement secure verification

-- Drop the problematic policy that blocks all public access
DROP POLICY IF EXISTS "Block public access to guest verification data" ON guest_verification_tokens;

-- Create a more permissive policy that allows verification functions to work
-- while still protecting sensitive data from direct access
CREATE POLICY "Allow secure token operations" ON guest_verification_tokens
  FOR SELECT 
  USING (
    -- Allow service role access (for system operations)
    (auth.role() = 'service_role'::text) OR
    -- Allow admin access (existing functionality)
    (EXISTS ( SELECT 1
       FROM (admin_sessions s JOIN admin_users u ON ((s.admin_user_id = u.id)))
      WHERE ((s.admin_user_id = auth.uid()) AND (s.expires_at > now()) AND (u.role = 'admin'::admin_role) AND (u.is_active = true))))
  );

-- Grant execute permissions on verification functions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.verify_guest_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_guest_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_data_for_deletion(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_guest_data_for_deletion(text) TO authenticated;

-- Reset the functions to their original form (SECURITY DEFINER should be enough)
CREATE OR REPLACE FUNCTION public.verify_guest_token(token_to_verify text)
 RETURNS TABLE(is_valid boolean, session_pseudonym text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (verification_token = token_to_verify AND expires_at > now()) as is_valid,
    gvt.session_pseudonym,
    gvt.expires_at
  FROM guest_verification_tokens gvt
  WHERE verification_token = token_to_verify
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_guest_data_for_deletion(pseudonym text)
 RETURNS TABLE(session_pseudonym text, verification_required boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only return minimal data needed for deletion process
  -- Don't expose email, full_name, or other personal details
  RETURN QUERY
  SELECT 
    gvt.session_pseudonym,
    (gvt.verification_token IS NOT NULL) as verification_required
  FROM guest_verification_tokens gvt
  WHERE gvt.session_pseudonym = pseudonym
  LIMIT 1;
END;
$function$;

-- Log the security fix
INSERT INTO public.audit_logs (event_type, details)
VALUES (
  'security_fix_guest_verification_v2',
  jsonb_build_object(
    'action', 'Removed blanket false RLS policy and restored function access',
    'security_improvement', 'Allows legitimate token verification while maintaining data protection',
    'functions_granted', ARRAY['verify_guest_token', 'get_guest_data_for_deletion'],
    'timestamp', now()
  )
);