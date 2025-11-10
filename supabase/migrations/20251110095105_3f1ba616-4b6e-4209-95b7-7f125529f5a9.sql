-- Create RPC function to get participant consents with admin session token validation
CREATE OR REPLACE FUNCTION public.get_participant_consents_with_token(session_token text)
RETURNS TABLE(
  id uuid,
  session_pseudonym text,
  full_name text,
  email text,
  age_range text,
  country text,
  region text,
  adult_declaration boolean,
  adult_declaration_timestamp timestamp with time zone,
  consent_train boolean,
  consent_store boolean,
  consent_timestamp timestamp with time zone,
  consent_evidence_data jsonb,
  digital_signature text,
  ip_address inet,
  user_agent text,
  device_info text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  withdrawn_at timestamp with time zone,
  withdrawal_reason text,
  migrated_from text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    pc.id,
    pc.session_pseudonym,
    pc.full_name,
    pc.email,
    pc.age_range,
    pc.country,
    pc.region,
    pc.adult_declaration,
    pc.adult_declaration_timestamp,
    pc.consent_train,
    pc.consent_store,
    pc.consent_timestamp,
    pc.consent_evidence_data,
    pc.digital_signature,
    pc.ip_address,
    pc.user_agent,
    pc.device_info,
    pc.created_at,
    pc.updated_at,
    pc.withdrawn_at,
    pc.withdrawal_reason,
    pc.migrated_from
  FROM participant_consents pc
  ORDER BY pc.created_at DESC;
END;
$$;