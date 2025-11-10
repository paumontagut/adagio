-- Step 1: Drop obsolete train_consents table
DROP TABLE IF EXISTS public.train_consents CASCADE;

-- Step 2: Create unified participant_consents table
CREATE TABLE public.participant_consents (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity fields
  session_pseudonym TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  
  -- GDPR mandatory fields
  age_range TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  adult_declaration BOOLEAN NOT NULL DEFAULT true,
  adult_declaration_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Consent fields
  consent_train BOOLEAN NOT NULL DEFAULT false,
  consent_store BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  digital_signature TEXT NOT NULL,
  
  -- Technical metadata
  ip_address INET,
  user_agent TEXT,
  device_info TEXT,
  consent_evidence_data JSONB,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT,
  
  -- Migration tracking
  migrated_from TEXT
);

-- Create indexes for performance
CREATE INDEX idx_participant_consents_session_pseudonym ON public.participant_consents(session_pseudonym);
CREATE INDEX idx_participant_consents_created_at ON public.participant_consents(created_at);
CREATE INDEX idx_participant_consents_email ON public.participant_consents(email) WHERE email IS NOT NULL;

-- Enable RLS
ALTER TABLE public.participant_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role has full access to participant consents"
  ON public.participant_consents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view participant consents"
  ON public.participant_consents
  FOR SELECT
  TO authenticated
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

-- Add trigger for updated_at
CREATE TRIGGER update_participant_consents_updated_at
  BEFORE UPDATE ON public.participant_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 3: Migrate data from consent_logs
INSERT INTO public.participant_consents (
  session_pseudonym,
  full_name,
  email,
  consent_train,
  consent_store,
  consent_timestamp,
  user_agent,
  created_at,
  updated_at,
  withdrawn_at,
  -- Default values for missing GDPR fields
  age_range,
  country,
  region,
  adult_declaration,
  adult_declaration_timestamp,
  digital_signature,
  device_info,
  consent_evidence_data,
  migrated_from
)
SELECT
  -- Use session_id as pseudonym or generate one if session_mapping exists
  COALESCE(
    (SELECT sm.session_pseudonym 
     FROM session_mapping sm 
     WHERE sm.session_pseudonym LIKE 'ps_%' 
     ORDER BY sm.created_at DESC 
     LIMIT 1),
    'migrated_' || cl.session_id
  ) as session_pseudonym,
  COALESCE(cl.full_name, 'Unknown') as full_name,
  cl.email,
  cl.consent_train,
  cl.consent_store,
  cl.consent_timestamp,
  cl.user_agent,
  cl.created_at,
  cl.updated_at,
  cl.withdrawn_at,
  -- Legacy data markers for missing GDPR fields
  'legacy_data' as age_range,
  'Unknown' as country,
  'Unknown' as region,
  true as adult_declaration,
  cl.created_at as adult_declaration_timestamp,
  encode(digest(convert_to(cl.id::text || cl.session_id || cl.created_at::text, 'UTF8'), 'sha256'), 'hex') as digital_signature,
  'Migrated from consent_logs on ' || now()::text as device_info,
  jsonb_build_object(
    'migrated', true,
    'original_table', 'consent_logs',
    'original_id', cl.id,
    'migration_date', now()
  ) as consent_evidence_data,
  'consent_logs' as migrated_from
FROM public.consent_logs cl
WHERE cl.withdrawn_at IS NULL;

-- Log migration in audit_logs
INSERT INTO public.audit_logs (event_type, details)
VALUES (
  'consent_data_migration',
  jsonb_build_object(
    'action', 'consolidated_consent_tables',
    'source_tables', ARRAY['train_consents', 'consent_logs', 'consent_evidence'],
    'target_table', 'participant_consents',
    'records_migrated', (SELECT COUNT(*) FROM public.participant_consents WHERE migrated_from = 'consent_logs'),
    'timestamp', now()
  )
);