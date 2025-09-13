-- Fix admin session validation (corrected policy name)
-- Drop the existing policy and create a new one with a different name
DROP POLICY IF EXISTS "Admin activity logging allowed" ON admin_activity_log;
DROP POLICY IF EXISTS "Authenticated admin activity logging only" ON admin_activity_log;

-- Create new policy for admin activity logging with fixed name
CREATE POLICY "Admins can log activity" ON admin_activity_log
FOR INSERT 
WITH CHECK (
  (auth.role() = 'service_role'::text) OR 
  (EXISTS (
    SELECT 1 
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid() 
    AND s.expires_at > now() 
    AND u.is_active = true
  ))
);

-- Create a new function that accepts session token directly for admin operations
CREATE OR REPLACE FUNCTION public.get_audio_metadata_with_token(session_token text)
RETURNS TABLE(
  id uuid, 
  session_pseudonym text, 
  phrase_text text, 
  audio_format text, 
  sample_rate integer, 
  duration_ms integer, 
  quality_score numeric, 
  consent_train boolean, 
  consent_store boolean, 
  encryption_key_version integer, 
  file_size_bytes bigint, 
  unencrypted_file_size_bytes bigint, 
  unencrypted_storage_bucket text, 
  unencrypted_file_path text, 
  device_info text, 
  created_at timestamp with time zone, 
  email text, 
  full_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Validate session token
  SELECT s.admin_user_id INTO admin_user_id
  FROM admin_sessions s
  JOIN admin_users u ON s.admin_user_id = u.id
  WHERE s.session_token = session_token 
  AND s.expires_at > now() 
  AND u.role IN ('admin', 'analyst')
  AND u.is_active = true;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired admin session';
  END IF;

  -- Return the data
  RETURN QUERY
  SELECT 
    am.id,
    am.session_pseudonym,
    am.phrase_text,
    am.audio_format,
    am.sample_rate,
    am.duration_ms,
    am.quality_score,
    am.consent_train,
    am.consent_store,
    am.encryption_key_version,
    am.file_size_bytes,
    am.unencrypted_file_size_bytes,
    am.unencrypted_storage_bucket,
    am.unencrypted_file_path,
    am.device_info,
    am.created_at,
    gvt.email,
    gvt.full_name
  FROM audio_metadata am
  LEFT JOIN guest_verification_tokens gvt ON am.session_pseudonym = gvt.session_pseudonym
  ORDER BY am.created_at DESC;
END;
$$;