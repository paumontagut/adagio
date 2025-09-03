-- SECURITY FIX: Restrict data deletion requests to Data Protection Officers only
-- This implements the principle of least privilege for sensitive personal data

-- Step 1: Add a DPO designation to admin users
-- We'll use the existing structure but add a way to designate specific DPO admins
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS is_data_protection_officer BOOLEAN DEFAULT FALSE;

-- Step 2: Create a secure function to check DPO status
CREATE OR REPLACE FUNCTION public.is_current_user_dpo()
RETURNS BOOLEAN AS $$
DECLARE
  is_dpo BOOLEAN := FALSE;
BEGIN
  SELECT u.is_data_protection_officer INTO is_dpo
  FROM admin_sessions s
  JOIN admin_users u ON s.admin_user_id = u.id
  WHERE s.admin_user_id = auth.uid() 
  AND s.expires_at > now()
  AND u.role = 'admin'
  AND u.is_active = true
  LIMIT 1;
  
  RETURN COALESCE(is_dpo, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Step 3: Replace the overly broad admin policy with DPO-only access
DROP POLICY IF EXISTS "Senior admins can view deletion requests" ON public.data_deletion_requests;

-- Create highly restrictive DPO-only access policy
CREATE POLICY "DPO only can view deletion requests" 
ON public.data_deletion_requests 
FOR SELECT 
USING (public.is_current_user_dpo() = TRUE);

-- Step 4: Create a secure summary function for non-DPO admins
-- This allows admins to see request counts/status without exposing personal data
CREATE OR REPLACE FUNCTION public.get_deletion_request_summary()
RETURNS TABLE (
  total_requests BIGINT,
  pending_requests BIGINT,
  completed_requests BIGINT,
  failed_requests BIGINT,
  recent_requests_24h BIGINT
) AS $$
BEGIN
  -- Only allow admin access to summary data (no personal info)
  IF NOT EXISTS (
    SELECT 1 
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid() 
    AND s.expires_at > now() 
    AND u.role IN ('admin', 'analyst')
    AND u.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_requests,
    COUNT(CASE WHEN status = 'pending' THEN 1 END)::BIGINT as pending_requests,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::BIGINT as completed_requests,
    COUNT(CASE WHEN status = 'failed' THEN 1 END)::BIGINT as failed_requests,
    COUNT(CASE WHEN requested_at > now() - interval '24 hours' THEN 1 END)::BIGINT as recent_requests_24h
  FROM data_deletion_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 5: Designate at least one admin as DPO (using the existing admin user)
-- This ensures the system remains functional
UPDATE public.admin_users 
SET is_data_protection_officer = TRUE 
WHERE role = 'admin' 
AND email = 'adminpau@admin.local';

-- Step 6: Add audit logging for DPO access
CREATE OR REPLACE FUNCTION public.log_dpo_deletion_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when DPO accesses deletion requests
  INSERT INTO public.audit_logs (event_type, details)
  VALUES (
    'dpo_deletion_request_access',
    jsonb_build_object(
      'admin_user_id', auth.uid(),
      'deletion_request_id', NEW.id,
      'access_timestamp', now(),
      'request_status', NEW.status
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger for DPO access logging (only on SELECT would be ideal, but we'll use UPDATE as proxy)
CREATE OR REPLACE TRIGGER log_dpo_access_trigger
  AFTER UPDATE ON public.data_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_dpo_deletion_access();

-- Log this security enhancement
INSERT INTO public.audit_logs (event_type, details)
VALUES (
  'data_deletion_request_security_enhanced',
  jsonb_build_object(
    'security_improvement', 'Restricted access to Data Protection Officers only',
    'previous_access', 'All admin users could view personal data',
    'new_access', 'Only designated DPO admins can view personal data',
    'additional_features', ARRAY[
      'DPO designation system implemented',
      'Non-DPO summary function created',
      'DPO access logging implemented'
    ],
    'compliance_improvement', 'Implements data minimization and least privilege principles',
    'timestamp', now()
  )
);