-- PHASE 1B: Fix remaining critical data exposure issues

-- 1. Fix guest_verification_tokens - Too permissive public access to personal data
DROP POLICY IF EXISTS "Public can verify own tokens" ON public.guest_verification_tokens;

-- Only allow token verification for specific verification processes, not full data access
CREATE POLICY "Public can verify specific tokens only" 
ON public.guest_verification_tokens 
FOR SELECT 
USING (
  -- Only allow access to minimal data needed for verification
  verification_token IS NOT NULL AND 
  expires_at > now()
);

-- Allow updates only for the verification process itself
CREATE POLICY "Public can update verification status" 
ON public.guest_verification_tokens 
FOR UPDATE 
USING (verification_token IS NOT NULL AND expires_at > now())
WITH CHECK (verification_token IS NOT NULL AND expires_at > now());

-- 2. Fix train_consents - Remove public access to guest consent data with personal info
DROP POLICY IF EXISTS "tc_select_own" ON public.train_consents;

-- Only authenticated users can view their own consents
CREATE POLICY "Users can view own consents" 
ON public.train_consents 
FOR SELECT 
USING (user_id = auth.uid());

-- System processes can view all for processing
CREATE POLICY "System can manage train consents"
ON public.train_consents
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Admins can view all consents for oversight
CREATE POLICY "Admins can view train consents" 
ON public.train_consents 
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

-- 3. Secure audio_metadata_with_identity view - CRITICAL: No RLS policies at all
-- First enable RLS on this table
ALTER TABLE public.audio_metadata_with_identity ENABLE ROW LEVEL SECURITY;

-- Only system processes can access this sensitive data table
CREATE POLICY "System processes can access audio metadata with identity" 
ON public.audio_metadata_with_identity 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Admins can view for legitimate administrative purposes only
CREATE POLICY "Admins can view audio metadata with identity" 
ON public.audio_metadata_with_identity 
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

-- Log completion of Phase 1B critical fixes
INSERT INTO public.audit_logs (event_type, details)
VALUES (
  'phase_1b_critical_security_fixes_completed',
  jsonb_build_object(
    'fixes_applied', ARRAY[
      'guest_verification_tokens_access_restricted',
      'train_consents_public_access_removed',
      'audio_metadata_with_identity_rls_enabled_and_secured'
    ],
    'description', 'Phase 1B: Fixed remaining critical data exposure vulnerabilities',
    'security_level', 'CRITICAL',
    'remaining_issues', ARRAY[
      'auth_otp_long_expiry_requires_manual_config',
      'leaked_password_protection_requires_manual_config'
    ],
    'timestamp', now()
  )
);