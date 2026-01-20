-- Create participant_consents table for GDPR consent evidence
CREATE TABLE public.participant_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_pseudonym TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  age_range TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  adult_declaration BOOLEAN NOT NULL DEFAULT true,
  consent_train BOOLEAN NOT NULL DEFAULT false,
  consent_store BOOLEAN NOT NULL DEFAULT false,
  consent_evidence_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.participant_consents ENABLE ROW LEVEL SECURITY;

-- Allow edge functions with service role to insert consent records
CREATE POLICY "Service role can insert consent records"
ON public.participant_consents
FOR INSERT
WITH CHECK (true);

-- Allow edge functions with service role to read consent records
CREATE POLICY "Service role can read consent records"
ON public.participant_consents
FOR SELECT
USING (true);

-- Create index on session_pseudonym for faster lookups
CREATE INDEX idx_participant_consents_session ON public.participant_consents(session_pseudonym);

-- Create index on created_at for audit trails
CREATE INDEX idx_participant_consents_created_at ON public.participant_consents(created_at DESC);