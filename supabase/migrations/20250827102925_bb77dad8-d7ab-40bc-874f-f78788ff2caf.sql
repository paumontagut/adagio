-- Create consent_logs table for GDPR compliance
CREATE TABLE public.consent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  consent_train BOOLEAN NOT NULL DEFAULT false,
  consent_store BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMP WITH TIME ZONE NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (public feature)
CREATE POLICY "Public consent logs access" 
ON public.consent_logs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_consent_logs_updated_at
BEFORE UPDATE ON public.consent_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_consent_logs_session_id ON public.consent_logs(session_id);
CREATE INDEX idx_consent_logs_withdrawn_at ON public.consent_logs(withdrawn_at) WHERE withdrawn_at IS NOT NULL;

-- Create unlearning_jobs table for managing model unlearning requests
CREATE TABLE public.unlearning_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consent_log_id UUID NOT NULL REFERENCES public.consent_logs(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE NULL,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  error_message TEXT,
  metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE public.unlearning_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for unlearning jobs
CREATE POLICY "Public unlearning jobs access" 
ON public.unlearning_jobs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_unlearning_jobs_status ON public.unlearning_jobs(status);
CREATE INDEX idx_unlearning_jobs_consent_log_id ON public.unlearning_jobs(consent_log_id);