-- Add columns to recordings table for name snapshot and consent timestamp
ALTER TABLE public.recordings 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

-- Create train_consents table for audit and name reuse
CREATE TABLE IF NOT EXISTS public.train_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,  -- for guests
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  consent_train BOOLEAN NOT NULL DEFAULT false,
  consent_store BOOLEAN NOT NULL DEFAULT false,
  consent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraints: only one consent per identity (user or session)
CREATE UNIQUE INDEX IF NOT EXISTS train_consents_user_unique
  ON public.train_consents(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS train_consents_session_unique
  ON public.train_consents(session_id) WHERE session_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.train_consents ENABLE ROW LEVEL SECURITY;

-- Policies: view/insert/update only own records
CREATE POLICY "tc_select_own" ON public.train_consents
  FOR SELECT USING (
    user_id = auth.uid() OR (user_id IS NULL)
  );

CREATE POLICY "tc_insert_self_or_guest" ON public.train_consents
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "tc_update_own" ON public.train_consents
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());