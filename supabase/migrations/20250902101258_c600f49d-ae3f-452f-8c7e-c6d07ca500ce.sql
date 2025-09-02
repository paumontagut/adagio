
-- 1) Índices para acelerar las búsquedas y joins
CREATE INDEX IF NOT EXISTS idx_audio_metadata_session_pseudonym
  ON public.audio_metadata(session_pseudonym);

CREATE INDEX IF NOT EXISTS idx_session_mapping_pseudonym
  ON public.session_mapping(session_pseudonym);

CREATE INDEX IF NOT EXISTS idx_consent_logs_session_id
  ON public.consent_logs(session_id);

-- 2) Vista robusta con el nombre y email ya resueltos en el servidor
CREATE OR REPLACE VIEW public.audio_metadata_with_identity AS
SELECT 
  am.id,
  am.session_pseudonym,
  am.phrase_text,
  am.duration_ms,
  am.sample_rate,
  am.audio_format,
  am.device_info,
  am.quality_score,
  am.consent_train,
  am.consent_store,
  am.encryption_key_version,
  am.unencrypted_file_path,
  am.unencrypted_storage_bucket,
  am.file_size_bytes,
  am.unencrypted_file_size_bytes,
  am.created_at,
  -- Preferimos el nombre del consentimiento (consent_logs),
  -- y si no existe, usamos el último token verificado/creado (guest_verification_tokens)
  COALESCE(c.full_name, g.full_name) AS full_name,
  COALESCE(c.email, g.email) AS email
FROM public.audio_metadata am
LEFT JOIN public.session_mapping sm
  ON sm.session_pseudonym = am.session_pseudonym
LEFT JOIN LATERAL (
  SELECT cl.full_name, cl.email
  FROM public.consent_logs cl
  WHERE cl.session_id = convert_from(sm.encrypted_session_id, 'UTF8')
  ORDER BY COALESCE(cl.consent_timestamp, cl.created_at) DESC
  LIMIT 1
) c ON true
LEFT JOIN LATERAL (
  SELECT gvt.full_name, gvt.email
  FROM public.guest_verification_tokens gvt
  WHERE gvt.session_pseudonym = am.session_pseudonym
  ORDER BY COALESCE(gvt.verified_at, gvt.created_at) DESC
  LIMIT 1
) g ON true;
