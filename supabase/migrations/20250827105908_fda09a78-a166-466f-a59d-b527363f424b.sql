-- Create pre-training audit system for membership inference checks

-- Table for training pipeline audits
CREATE TABLE public.training_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_type TEXT NOT NULL DEFAULT 'membership_inference',
  training_batch_id TEXT NOT NULL,
  sample_size INTEGER NOT NULL,
  risk_threshold DECIMAL(5,4) NOT NULL DEFAULT 0.1500, -- 15% threshold
  calculated_risk DECIMAL(5,4),
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  pipeline_blocked BOOLEAN NOT NULL DEFAULT false,
  audit_results JSONB NOT NULL,
  eipd_report JSONB, -- Privacy Impact Assessment report
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  review_notes TEXT
);

-- Table for training pipeline status
CREATE TABLE public.training_pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'auditing', 'approved', 'blocked', 'training', 'completed', 'failed')),
  batch_count INTEGER NOT NULL DEFAULT 0,
  total_samples INTEGER NOT NULL DEFAULT 0,
  consent_verified BOOLEAN NOT NULL DEFAULT false,
  audit_passed BOOLEAN NOT NULL DEFAULT false,
  training_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  blocked_reason TEXT,
  eipd_approved BOOLEAN NOT NULL DEFAULT false,
  dpo_approval TEXT
);

-- Table for membership inference test results
CREATE TABLE public.membership_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.training_audits(id),
  sample_id TEXT NOT NULL,
  session_pseudonym TEXT NOT NULL,
  target_model_confidence DECIMAL(8,6) NOT NULL,
  shadow_model_confidence DECIMAL(8,6) NOT NULL,
  membership_score DECIMAL(8,6) NOT NULL,
  is_member_prediction BOOLEAN NOT NULL,
  actual_membership BOOLEAN NOT NULL,
  correct_prediction BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all audit tables
ALTER TABLE public.training_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit system (system access)
CREATE POLICY "System access to training audits"
ON public.training_audits
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "System access to training pipelines"
ON public.training_pipelines
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "System access to membership tests"
ON public.membership_tests
FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_training_audits_batch_id ON public.training_audits(training_batch_id);
CREATE INDEX idx_training_audits_risk_level ON public.training_audits(risk_level);
CREATE INDEX idx_training_audits_created_at ON public.training_audits(created_at);
CREATE INDEX idx_training_pipelines_status ON public.training_pipelines(status);
CREATE INDEX idx_training_pipelines_audit_passed ON public.training_pipelines(audit_passed);
CREATE INDEX idx_membership_tests_audit_id ON public.membership_tests(audit_id);
CREATE INDEX idx_membership_tests_membership_score ON public.membership_tests(membership_score);

-- Function to calculate membership inference risk
CREATE OR REPLACE FUNCTION public.calculate_membership_risk(
  audit_id_param UUID
)
RETURNS DECIMAL(5,4)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  total_tests INTEGER;
  correct_predictions INTEGER;
  high_confidence_leaks INTEGER;
  avg_membership_score DECIMAL(8,6);
  risk_score DECIMAL(5,4);
BEGIN
  -- Get test statistics
  SELECT 
    COUNT(*),
    SUM(CASE WHEN correct_prediction = true THEN 1 ELSE 0 END),
    SUM(CASE WHEN membership_score > 0.8 AND is_member_prediction = true THEN 1 ELSE 0 END),
    AVG(membership_score)
  INTO 
    total_tests,
    correct_predictions,
    high_confidence_leaks,
    avg_membership_score
  FROM public.membership_tests
  WHERE audit_id = audit_id_param;

  -- Calculate risk score based on multiple factors
  -- Base risk from prediction accuracy
  risk_score := (correct_predictions::DECIMAL / total_tests::DECIMAL);
  
  -- Amplify risk for high confidence leaks
  risk_score := risk_score + (high_confidence_leaks::DECIMAL / total_tests::DECIMAL * 0.5);
  
  -- Factor in average membership score
  risk_score := risk_score + (avg_membership_score - 0.5) * 0.3;
  
  -- Cap at 1.0
  risk_score := LEAST(risk_score, 1.0);
  
  RETURN risk_score;
END;
$$;

-- Function to determine risk level
CREATE OR REPLACE FUNCTION public.get_risk_level(risk_score DECIMAL(5,4))
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF risk_score < 0.10 THEN
    RETURN 'LOW';
  ELSIF risk_score < 0.15 THEN
    RETURN 'MEDIUM';
  ELSIF risk_score < 0.25 THEN
    RETURN 'HIGH';
  ELSE
    RETURN 'CRITICAL';
  END IF;
END;
$$;

-- Function to block pipeline if risk is too high
CREATE OR REPLACE FUNCTION public.evaluate_pipeline_risk(
  audit_id_param UUID,
  threshold DECIMAL(5,4) DEFAULT 0.1500
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  calculated_risk DECIMAL(5,4);
  risk_level_text TEXT;
  should_block BOOLEAN := false;
  batch_id TEXT;
BEGIN
  -- Calculate membership inference risk
  calculated_risk := public.calculate_membership_risk(audit_id_param);
  risk_level_text := public.get_risk_level(calculated_risk);
  
  -- Determine if pipeline should be blocked
  should_block := calculated_risk > threshold;
  
  -- Update audit record
  UPDATE public.training_audits
  SET 
    calculated_risk = calculated_risk,
    risk_level = risk_level_text,
    pipeline_blocked = should_block,
    completed_at = now()
  WHERE id = audit_id_param
  RETURNING training_batch_id INTO batch_id;
  
  -- Update pipeline status
  IF should_block THEN
    UPDATE public.training_pipelines
    SET 
      status = 'blocked',
      audit_passed = false,
      blocked_reason = 'Membership inference risk (' || calculated_risk::TEXT || ') exceeds threshold (' || threshold::TEXT || ')'
    WHERE pipeline_name = batch_id;
    
    -- Log audit event
    INSERT INTO public.audit_logs (event_type, details)
    VALUES (
      'pipeline_blocked_high_risk',
      jsonb_build_object(
        'audit_id', audit_id_param,
        'batch_id', batch_id,
        'calculated_risk', calculated_risk,
        'threshold', threshold,
        'risk_level', risk_level_text,
        'blocked_at', now()
      )
    );
  ELSE
    UPDATE public.training_pipelines
    SET 
      status = 'approved',
      audit_passed = true
    WHERE pipeline_name = batch_id;
    
    -- Log audit event
    INSERT INTO public.audit_logs (event_type, details)
    VALUES (
      'pipeline_approved_low_risk',
      jsonb_build_object(
        'audit_id', audit_id_param,
        'batch_id', batch_id,
        'calculated_risk', calculated_risk,
        'threshold', threshold,
        'risk_level', risk_level_text,
        'approved_at', now()
      )
    );
  END IF;
  
  RETURN should_block;
END;
$$;