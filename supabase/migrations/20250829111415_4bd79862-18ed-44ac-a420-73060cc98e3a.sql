
-- Ensure pgcrypto is available in the 'extensions' schema
create extension if not exists pgcrypto with schema extensions;

-- Fix generate_pseudonym to include 'extensions' in search_path and use correct digest signature
create or replace function public.generate_pseudonym(original_session_id text)
returns text
language plpgsql
security definER
set search_path to 'public, extensions'
as $function$
declare
  pseudonym text;
  input_bytes bytea;
begin
  -- Convert text to bytea for pgcrypto.digest
  input_bytes := convert_to(original_session_id || extract(epoch from now())::text, 'UTF8');
  pseudonym := encode(extensions.digest(input_bytes, 'sha256'), 'hex');
  return 'ps_' || substring(pseudonym from 1 for 32);
end;
$function$;

-- Also fix rotate_encryption_key to avoid future failures
create or replace function public.rotate_encryption_key()
returns integer
language plpgsql
security definER
set search_path to 'public, extensions'
as $function$
declare
  new_version integer;
begin
  update public.encryption_keys set is_active = false where is_active = true;

  select coalesce(max(version), 0) + 1 into new_version from public.encryption_keys;

  insert into public.encryption_keys (version, key_hash, is_active, rotation_reason)
  values (
    new_version,
    extensions.digest(convert_to('placeholder_key_' || new_version::text, 'UTF8'), 'sha256'),
    true,
    'Scheduled rotation'
  );

  return new_version;
end;
$function$;

-- And fix rotate_storage_key as it also uses digest
create or replace function public.rotate_storage_key(target_bucket_id text)
returns integer
language plpgsql
security definER
set search_path to 'public, extensions'
as $function$
declare
  new_version integer;
begin
  update public.storage_keys
  set is_active = false
  where bucket_id = target_bucket_id and is_active = true;

  select coalesce(max(key_version), 0) + 1
  into new_version
  from public.storage_keys
  where bucket_id = target_bucket_id;

  insert into public.storage_keys (bucket_id, key_version, key_hash, is_active, rotation_reason)
  values (
    target_bucket_id,
    new_version,
    extensions.digest(
      convert_to(target_bucket_id || '_key_' || new_version::text || '_' || extract(epoch from now())::text, 'UTF8'),
      'sha256'
    ),
    true,
    'Scheduled rotation'
  );

  return new_version;
end;
$function$;
