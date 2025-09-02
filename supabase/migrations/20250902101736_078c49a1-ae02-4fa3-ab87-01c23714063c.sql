-- Fix linter error: ensure the view runs with invoker privileges
ALTER VIEW public.audio_metadata_with_identity SET (security_invoker = true);
-- Optional hardening
ALTER VIEW public.audio_metadata_with_identity SET (security_barrier = true);