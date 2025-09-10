-- Fix guest verification system RLS policies (simplified approach)
-- Remove the blanket blocking policy and implement secure verification

-- Drop the problematic policy that blocks all public access
DROP POLICY IF EXISTS "Block public access to guest verification data" ON guest_verification_tokens;

-- Create a policy that allows verification through secure functions
-- while still protecting sensitive data from direct table access
CREATE POLICY "Allow secure token verification" ON guest_verification_tokens
  FOR SELECT 
  USING (
    -- Allow service role for system operations
    (auth.role() = 'service_role'::text) OR
    -- Allow access for SECURITY DEFINER function context
    -- This will allow the verify_guest_token function to work
    (current_setting('request.jwt.claims', true)::json->>'role' IS NULL)
  );

-- Ensure anonymous users can call the verification functions
GRANT EXECUTE ON FUNCTION public.verify_guest_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_guest_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_data_for_deletion(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_guest_data_for_deletion(text) TO authenticated;

-- Log the security fix
INSERT INTO public.audit_logs (event_type, details)
VALUES (
  'security_fix_guest_verification',
  jsonb_build_object(
    'fix_description', 'Removed blanket blocking RLS policy to allow legitimate token verification',
    'security_approach', 'Use SECURITY DEFINER functions for controlled access',
    'functions_enabled', ARRAY['verify_guest_token', 'get_guest_data_for_deletion'],
    'timestamp', now()
  )
);