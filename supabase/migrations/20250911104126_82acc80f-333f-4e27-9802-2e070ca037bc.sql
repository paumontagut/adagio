-- Create admin user for montagutpau@gmail.com
-- First enable pgcrypto extension if not enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the auth user first
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Generate a new user ID
  new_user_id := gen_random_uuid();
  
  -- Insert into auth.users (this requires service_role privileges)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'montagutpau@gmail.com',
    crypt('Esportiu1', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"first_name": "Pau", "last_name": "Montagut"}'::jsonb,
    '',
    '',
    '',
    ''
  );

  -- Create the profile
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (new_user_id, 'montagutpau@gmail.com', 'Pau', 'Montagut')
  ON CONFLICT (id) DO NOTHING;

  -- Create the admin user record
  INSERT INTO public.admin_users (id, email, full_name, role, is_active, is_data_protection_officer, created_at, updated_at)
  VALUES (new_user_id, 'montagutpau@gmail.com', 'Pau Montagut', 'admin', true, true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = 'admin',
    is_active = true,
    is_data_protection_officer = true,
    updated_at = NOW();

  -- Log the admin creation
  INSERT INTO public.audit_logs (event_type, details)
  VALUES (
    'admin_user_created',
    jsonb_build_object(
      'admin_user_id', new_user_id,
      'email', 'montagutpau@gmail.com',
      'full_name', 'Pau Montagut',
      'role', 'admin',
      'is_dpo', true,
      'created_at', NOW()
    )
  );
END $$;