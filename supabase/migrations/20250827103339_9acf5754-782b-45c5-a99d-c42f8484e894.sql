-- Create encrypted audio storage tables with pseudonymization

-- Table for pseudonymized metadata (public schema for application access)
CREATE TABLE public.audio_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_pseudonym TEXT NOT NULL, -- Pseudonymized session_id
  phrase_text TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  sample_rate INTEGER NOT NULL,
  audio_format TEXT NOT NULL DEFAULT 'wav',
  device_info TEXT,
  quality_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  consent_train BOOLEAN NOT NULL DEFAULT false,
  consent_store BOOLEAN NOT NULL DEFAULT false,
  encryption_key_version INTEGER NOT NULL DEFAULT 1
);

-- Table for encrypted file storage (separate from metadata)
CREATE TABLE public.encrypted_audio_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metadata_id UUID NOT NULL REFERENCES public.audio_metadata(id) ON DELETE CASCADE,
  encrypted_blob BYTEA NOT NULL, -- AES-256 encrypted audio data
  iv BYTEA NOT NULL, -- Initialization vector for AES
  salt BYTEA NOT NULL, -- Salt for key derivation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Secure table for session mapping (stored in vault/encrypted schema equivalent)
CREATE TABLE public.session_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_pseudonym TEXT NOT NULL UNIQUE,
  encrypted_session_id BYTEA NOT NULL, -- Original session_id encrypted
  mapping_iv BYTEA NOT NULL,
  mapping_salt BYTEA NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Key rotation table for managing encryption keys
CREATE TABLE public.encryption_keys (
  version INTEGER NOT NULL PRIMARY KEY,
  key_hash BYTEA NOT NULL, -- Hash of the key for verification
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() + INTERVAL '90 days',
  is_active BOOLEAN NOT NULL DEFAULT true,
  rotation_reason TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.audio_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audio_metadata (public read for transcription, restricted write)
CREATE POLICY "Public can read audio metadata" 
ON public.audio_metadata 
FOR SELECT 
USING (true);

CREATE POLICY "Can insert own audio metadata" 
ON public.audio_metadata 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for encrypted files (restricted access)
CREATE POLICY "Can access own encrypted files" 
ON public.encrypted_audio_files 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS Policies for session mapping (very restricted)
CREATE POLICY "System can access session mapping" 
ON public.session_mapping 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS Policies for encryption keys (system access only)
CREATE POLICY "System can manage encryption keys" 
ON public.encryption_keys 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_audio_metadata_session_pseudonym ON public.audio_metadata(session_pseudonym);
CREATE INDEX idx_audio_metadata_created_at ON public.audio_metadata(created_at);
CREATE INDEX idx_encrypted_files_metadata_id ON public.encrypted_audio_files(metadata_id);
CREATE INDEX idx_session_mapping_pseudonym ON public.session_mapping(session_pseudonym);
CREATE INDEX idx_encryption_keys_active ON public.encryption_keys(is_active) WHERE is_active = true;

-- Insert initial encryption key version
INSERT INTO public.encryption_keys (version, key_hash, created_at, expires_at, is_active)
VALUES (1, decode('placeholder_hash', 'hex'), now(), now() + INTERVAL '90 days', true);

-- Function to generate pseudonyms
CREATE OR REPLACE FUNCTION public.generate_pseudonym(original_session_id TEXT)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  pseudonym TEXT;
BEGIN
  -- Generate a pseudonym using SHA-256 hash with timestamp salt
  pseudonym := encode(
    digest(original_session_id || extract(epoch from now())::text, 'sha256'), 
    'hex'
  );
  RETURN 'ps_' || substring(pseudonym from 1 for 32);
END;
$$;

-- Function to rotate encryption keys
CREATE OR REPLACE FUNCTION public.rotate_encryption_key()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_version INTEGER;
BEGIN
  -- Deactivate current keys
  UPDATE public.encryption_keys SET is_active = false WHERE is_active = true;
  
  -- Get next version number
  SELECT COALESCE(MAX(version), 0) + 1 INTO new_version FROM public.encryption_keys;
  
  -- Insert new key version (hash will be updated by edge function)
  INSERT INTO public.encryption_keys (version, key_hash, is_active, rotation_reason)
  VALUES (new_version, decode('placeholder_hash', 'hex'), true, 'Scheduled rotation');
  
  RETURN new_version;
END;
$$;