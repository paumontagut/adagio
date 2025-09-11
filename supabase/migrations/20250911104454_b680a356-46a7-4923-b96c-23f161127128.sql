-- Fix admin session validation in functions
-- The issue is that admin functions are checking auth.uid() but admins use session tokens

-- Update get_audio_metadata_with_identity to work with session token validation
CREATE OR REPLACE FUNCTION public.get_audio_metadata_with_identity()
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
BEGIN
  -- Allow service role access
  IF auth.role() = 'service_role'::text THEN
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
    LEFT JOIN guest_verification_tokens gvt ON am.session_pseudonym = gvt.session_pseudonym;
    RETURN;
  END IF;

  -- For admin access, we need to check if the current session is a valid admin session
  -- Since we can't directly access the session token in this context, 
  -- we need to check if the current auth.uid() has an active admin session
  IF EXISTS (
    SELECT 1 
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid() 
    AND s.expires_at > now() 
    AND u.role IN ('admin', 'analyst')
    AND u.is_active = true
  ) THEN
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
    LEFT JOIN guest_verification_tokens gvt ON am.session_pseudonym = gvt.session_pseudonym;
    RETURN;
  END IF;

  -- If no valid admin session, deny access
  RAISE EXCEPTION 'Access denied: Admin privileges required';
END;
$$;

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

-- Fix admin_activity_log RLS policy to allow admins to insert logs
DROP POLICY IF EXISTS "Authenticated admin activity logging only" ON admin_activity_log;

CREATE POLICY "Admin activity logging allowed" ON admin_activity_log
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