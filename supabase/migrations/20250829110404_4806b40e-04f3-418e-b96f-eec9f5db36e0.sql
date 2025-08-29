-- Insert initial encryption key if none exists
INSERT INTO public.encryption_keys (version, key_hash, is_active, rotation_reason)
SELECT 1, digest('initial_master_key_v1', 'sha256'), true, 'Initial setup'
WHERE NOT EXISTS (SELECT 1 FROM public.encryption_keys WHERE version = 1);