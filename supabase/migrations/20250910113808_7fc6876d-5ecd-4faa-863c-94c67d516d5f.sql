-- Fix guest verification system RLS policies
-- Remove the blanket blocking policy and implement secure token-based verification

-- Drop the problematic policy that blocks all public access
DROP POLICY IF EXISTS "Block public access to guest verification data" ON guest_verification_tokens;

-- Create a secure policy that allows token verification without exposing sensitive data
-- This allows the verify_guest_token function to work properly
CREATE POLICY "Allow token verification via function" ON guest_verification_tokens
  FOR SELECT 
  USING (
    -- Only allow access when called from SECURITY DEFINER functions
    -- or by service role for system operations
    (auth.role() = 'service_role'::text) OR
    -- Allow verification through the secure function context
    -- The SECURITY DEFINER function will have elevated privileges
    (current_setting('role', true) = 'supabase_admin')
  );

-- Ensure the verify_guest_token function can be called by anonymous users
-- Grant execute permission on the verification function
GRANT EXECUTE ON FUNCTION public.verify_guest_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_guest_token(text) TO authenticated;

-- Also grant permission for the deletion-related function
GRANT EXECUTE ON FUNCTION public.get_guest_data_for_deletion(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_guest_data_for_deletion(text) TO authenticated;

-- Update the verify_guest_token function to ensure it works with the new policy
-- Set the role temporarily to allow access within the function
CREATE OR REPLACE FUNCTION public.verify_guest_token(token_to_verify text)
 RETURNS TABLE(is_valid boolean, session_pseudonym text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET role TO 'supabase_admin'
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

-- Also update the deletion function with proper role setting
CREATE OR REPLACE FUNCTION public.get_guest_data_for_deletion(pseudonym text)
 RETURNS TABLE(session_pseudonym text, verification_required boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET role TO 'supabase_admin'
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

-- Log the security fix in audit logs
INSERT INTO public.audit_logs (event_type, details)
VALUES (
  'security_fix_guest_verification',
  jsonb_build_object(
    'fix_description', 'Replaced blanket blocking RLS policy with secure token-based verification',
    'functions_updated', ARRAY['verify_guest_token', 'get_guest_data_for_deletion'],
    'security_principle', 'Allow legitimate verification while protecting sensitive data',
    'timestamp', now()
  )
);