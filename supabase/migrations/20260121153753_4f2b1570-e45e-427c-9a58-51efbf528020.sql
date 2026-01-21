-- Add user_id column to participant_consents for linking with authenticated users
ALTER TABLE public.participant_consents 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for fast lookups by user_id
CREATE INDEX idx_participant_consents_user_id ON public.participant_consents(user_id);

-- Create index for fast lookups by email
CREATE INDEX idx_participant_consents_email ON public.participant_consents(email);