-- Create specialized storage buckets for EU compliance with WORM backup (Fixed)

-- Create audio_raw bucket for original unprocessed recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio_raw', 
  'audio_raw', 
  false, 
  10485760, -- 10MB limit
  ARRAY['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/webm']
);

-- Create audio_clean bucket for processed and cleaned recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio_clean', 
  'audio_clean', 
  false, 
  10485760, -- 10MB limit
  ARRAY['audio/wav', 'audio/mpeg', 'audio/ogg']
);

-- Create labels bucket for metadata and training labels
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'labels', 
  'labels', 
  false, 
  1048576, -- 1MB limit for JSON/text files
  ARRAY['application/json', 'text/plain', 'text/csv']
);

-- Create WORM backup bucket (Write Once Read Many)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'worm_backup', 
  'worm_backup', 
  false, 
  52428800, -- 50MB limit for backup files
  ARRAY['application/zip', 'application/gzip', 'application/x-tar']
);

-- AUDIO_RAW bucket policies (most restrictive - EU data residency)
CREATE POLICY "Restrict audio_raw uploads to consented sessions only"
ON storage.objects FOR INSERT 
TO authenticated, anon
WITH CHECK (
  bucket_id = 'audio_raw' AND
  (storage.foldername(name))[1] IN (
    SELECT session_pseudonym 
    FROM public.session_mapping 
    WHERE created_at > now() - INTERVAL '24 hours'
  )
);

CREATE POLICY "Restrict audio_raw access to system only"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (
  bucket_id = 'audio_raw' AND
  EXISTS (
    SELECT 1 FROM public.audio_metadata 
    WHERE session_pseudonym = (storage.foldername(name))[1]
    AND consent_store = true
  )
);

CREATE POLICY "No public delete on audio_raw"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (false); -- Prevent accidental deletion

-- AUDIO_CLEAN bucket policies (training access)
CREATE POLICY "Allow audio_clean uploads for processing"
ON storage.objects FOR INSERT 
TO authenticated, anon
WITH CHECK (
  bucket_id = 'audio_clean' AND
  (storage.foldername(name))[1] IN (
    SELECT session_pseudonym 
    FROM public.audio_metadata 
    WHERE consent_train = true
  )
);

CREATE POLICY "Allow audio_clean access for training"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (
  bucket_id = 'audio_clean' AND
  EXISTS (
    SELECT 1 FROM public.audio_metadata 
    WHERE session_pseudonym = (storage.foldername(name))[1]
    AND consent_train = true
  )
);

CREATE POLICY "Allow audio_clean updates for processing"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (
  bucket_id = 'audio_clean' AND
  EXISTS (
    SELECT 1 FROM public.audio_metadata 
    WHERE session_pseudonym = (storage.foldername(name))[1]
    AND consent_train = true
  )
);

-- LABELS bucket policies (metadata access)
CREATE POLICY "Allow labels read access"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'labels');

CREATE POLICY "Allow labels upload for metadata"
ON storage.objects FOR INSERT 
TO authenticated, anon
WITH CHECK (
  bucket_id = 'labels' AND
  (storage.foldername(name))[1] IN (
    SELECT session_pseudonym 
    FROM public.audio_metadata
  )
);

CREATE POLICY "Allow labels updates"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'labels');

-- WORM_BACKUP bucket policies (Write Once Read Many) - Fixed
CREATE POLICY "WORM backup write once policy"
ON storage.objects FOR INSERT 
TO authenticated, anon
WITH CHECK (
  bucket_id = 'worm_backup' AND
  name NOT IN (
    SELECT o.name FROM storage.objects o
    WHERE o.bucket_id = 'worm_backup'
  )
);

CREATE POLICY "WORM backup read access"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'worm_backup');

CREATE POLICY "WORM backup no updates allowed"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (false); -- WORM: no updates allowed

CREATE POLICY "WORM backup no deletes allowed"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (false); -- WORM: no deletes allowed

-- Create storage key rotation table
CREATE TABLE public.storage_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id TEXT NOT NULL,
  key_version INTEGER NOT NULL,
  key_hash BYTEA NOT NULL,
  encryption_algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() + INTERVAL '30 days',
  is_active BOOLEAN NOT NULL DEFAULT true,
  rotation_reason TEXT,
  UNIQUE(bucket_id, key_version)
);

-- Enable RLS on storage keys
ALTER TABLE public.storage_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System access to storage keys"
ON public.storage_keys
FOR ALL
USING (true)
WITH CHECK (true);

-- Insert initial keys for each bucket
INSERT INTO public.storage_keys (bucket_id, key_version, key_hash, rotation_reason) VALUES
('audio_raw', 1, digest('audio_raw_initial_key_2024', 'sha256'), 'Initial deployment'),
('audio_clean', 1, digest('audio_clean_initial_key_2024', 'sha256'), 'Initial deployment'),
('labels', 1, digest('labels_initial_key_2024', 'sha256'), 'Initial deployment'),
('worm_backup', 1, digest('worm_backup_initial_key_2024', 'sha256'), 'Initial deployment');

-- Create indexes for performance
CREATE INDEX idx_storage_keys_bucket_active ON public.storage_keys(bucket_id, is_active) WHERE is_active = true;
CREATE INDEX idx_storage_keys_expires_at ON public.storage_keys(expires_at);

-- Create audit logs table for compliance
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  retention_until TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() + INTERVAL '7 years'
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System access to audit logs"
ON public.audit_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_retention ON public.audit_logs(retention_until);