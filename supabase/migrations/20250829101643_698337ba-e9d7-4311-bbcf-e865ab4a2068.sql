-- Create guest verification tokens table for GDPR compliance
CREATE TABLE public.guest_verification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_pseudonym TEXT NOT NULL,
  email TEXT NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  full_name TEXT,
  device_info TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  verified_at TIMESTAMP WITH TIME ZONE,
  used_for_deletion BOOLEAN DEFAULT false,
  deletion_requested_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.guest_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (needed for verification and deletion requests)
CREATE POLICY "Public access to guest verification tokens" 
ON public.guest_verification_tokens 
FOR ALL
USING (true)
WITH CHECK (true);

-- Create data deletion requests table for tracking deletion processes
CREATE TABLE public.data_deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_pseudonym TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('guest_token', 'manual_verification', 'user_account')),
  email TEXT,
  verification_token TEXT,
  full_name TEXT,
  additional_info JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  deletion_summary JSONB,
  processed_by TEXT, -- DPO identifier
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (for creating requests)
CREATE POLICY "Public can create deletion requests" 
ON public.data_deletion_requests 
FOR INSERT
WITH CHECK (true);

-- Create policy for reading own requests (by token or email)
CREATE POLICY "Can read own deletion requests" 
ON public.data_deletion_requests 
FOR SELECT
USING (true);

-- System access policy for DPO operations
CREATE POLICY "System can manage deletion requests" 
ON public.data_deletion_requests 
FOR ALL
USING (true)
WITH CHECK (true);

-- Add email field to consent_logs for better traceability
ALTER TABLE public.consent_logs 
ADD COLUMN email TEXT,
ADD COLUMN full_name TEXT,
ADD COLUMN verification_token TEXT;

-- Create index for faster lookups
CREATE INDEX idx_guest_verification_tokens_token ON public.guest_verification_tokens(verification_token);
CREATE INDEX idx_guest_verification_tokens_session ON public.guest_verification_tokens(session_pseudonym);
CREATE INDEX idx_guest_verification_tokens_email ON public.guest_verification_tokens(email);
CREATE INDEX idx_data_deletion_requests_token ON public.data_deletion_requests(verification_token);
CREATE INDEX idx_data_deletion_requests_status ON public.data_deletion_requests(status);
CREATE INDEX idx_consent_logs_verification_token ON public.consent_logs(verification_token);