-- Add storage management functions

-- Function to rotate storage keys
CREATE OR REPLACE FUNCTION public.rotate_storage_key(target_bucket_id TEXT)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_version INTEGER;
BEGIN
  -- Deactivate current keys for the bucket
  UPDATE public.storage_keys 
  SET is_active = false 
  WHERE bucket_id = target_bucket_id AND is_active = true;
  
  -- Get next version number for this bucket
  SELECT COALESCE(MAX(key_version), 0) + 1 
  INTO new_version 
  FROM public.storage_keys 
  WHERE bucket_id = target_bucket_id;
  
  -- Insert new key version
  INSERT INTO public.storage_keys (bucket_id, key_version, key_hash, is_active, rotation_reason)
  VALUES (
    target_bucket_id, 
    new_version, 
    digest(target_bucket_id || '_key_' || new_version::text || '_' || extract(epoch from now())::text, 'sha256'), 
    true, 
    'Scheduled rotation'
  );
  
  RETURN new_version;
END;
$$;

-- Function to create WORM backup
CREATE OR REPLACE FUNCTION public.create_worm_backup(
  source_bucket TEXT,
  backup_name TEXT,
  retention_years INTEGER DEFAULT 7
)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  backup_id TEXT;
BEGIN
  -- Generate unique backup ID
  backup_id := 'backup_' || source_bucket || '_' || extract(epoch from now())::text;
  
  -- Log backup creation (actual backup would be handled by edge function)
  INSERT INTO public.audit_logs (
    event_type,
    details,
    retention_until
  ) VALUES (
    'worm_backup_created',
    jsonb_build_object(
      'backup_id', backup_id,
      'source_bucket', source_bucket,
      'backup_name', backup_name,
      'created_at', now()
    ),
    now() + (retention_years || ' years')::interval
  );
  
  RETURN backup_id;
END;
$$;