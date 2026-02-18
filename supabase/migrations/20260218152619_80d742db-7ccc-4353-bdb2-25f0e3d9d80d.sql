-- Fix participant_consents: replace overly permissive public policies with service_role only
DROP POLICY IF EXISTS "Service role can insert consent records" ON public.participant_consents;
DROP POLICY IF EXISTS "Service role can read consent records" ON public.participant_consents;

CREATE POLICY "Service role can insert consent records"
ON public.participant_consents
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can read consent records"
ON public.participant_consents
FOR SELECT
TO service_role
USING (true);