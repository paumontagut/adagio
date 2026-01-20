-- Function to get participant consents with admin session token validation
CREATE OR REPLACE FUNCTION public.get_participant_consents_with_token(p_session_token TEXT)
RETURNS TABLE (
  id uuid,
  session_pseudonym text,
  full_name text,
  email text,
  age_range text,
  country text,
  region text,
  adult_declaration boolean,
  adult_declaration_timestamp timestamptz,
  consent_train boolean,
  consent_store boolean,
  consent_timestamp timestamptz,
  consent_evidence_data jsonb,
  digital_signature text,
  ip_address text,
  user_agent text,
  device_info text,
  created_at timestamptz,
  withdrawn_at timestamptz,
  withdrawal_reason text,
  migrated_from text
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Validate admin session
  SELECT u.id, u.role, u.is_active
  INTO admin_record
  FROM public.admin_users u
  JOIN public.admin_sessions s ON s.admin_user_id = u.id
  WHERE s.session_token = p_session_token 
  AND s.expires_at > now()
  AND u.is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired admin session';
  END IF;
  
  IF admin_record.role NOT IN ('admin', 'analyst') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Return participant consents
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
    pc.created_at as adult_declaration_timestamp,
    pc.consent_train,
    pc.consent_store,
    pc.created_at as consent_timestamp,
    pc.consent_evidence_data,
    NULL::text as digital_signature,
    pc.ip_address,
    pc.user_agent,
    pc.device_info,
    pc.created_at,
    NULL::timestamptz as withdrawn_at,
    NULL::text as withdrawal_reason,
    NULL::text as migrated_from
  FROM public.participant_consents pc
  ORDER BY pc.created_at DESC;
END;
$$;

-- Function to log consent evidence access for audit
CREATE OR REPLACE FUNCTION public.log_consent_evidence_access(
  p_consent_evidence_id uuid,
  p_session_pseudonym text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (event_type, details)
  VALUES ('consent_evidence_access', jsonb_build_object(
    'consent_id', p_consent_evidence_id,
    'session_pseudonym', p_session_pseudonym,
    'accessed_at', now()
  ));
END;
$$;