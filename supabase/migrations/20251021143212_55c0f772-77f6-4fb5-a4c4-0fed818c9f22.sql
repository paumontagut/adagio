-- Tabla para almacenar evidencia completa de consentimientos
CREATE TABLE IF NOT EXISTS public.consent_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_pseudonym TEXT NOT NULL,
  
  -- Datos personales del participante
  full_name TEXT NOT NULL,
  email TEXT,
  age_range TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  
  -- Declaración de mayoría de edad
  adult_declaration BOOLEAN NOT NULL DEFAULT false,
  adult_declaration_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Consentimientos otorgados
  consent_train BOOLEAN NOT NULL DEFAULT false,
  consent_store BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Evidencia del consentimiento (formulario completo)
  consent_evidence_data JSONB NOT NULL,
  
  -- Firma digital del consentimiento (hash para verificación)
  digital_signature TEXT NOT NULL,
  
  -- Metadatos de la sesión
  ip_address INET,
  user_agent TEXT,
  device_info TEXT,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Revocación del consentimiento
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  withdrawal_reason TEXT
);

-- Habilitar RLS
ALTER TABLE public.consent_evidence ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins puedan ver
CREATE POLICY "Admins can view consent evidence"
ON public.consent_evidence
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid() 
    AND s.expires_at > now() 
    AND u.role IN ('admin', 'analyst')
    AND u.is_active = true
  )
);

-- Política para que el sistema pueda gestionar
CREATE POLICY "System processes can manage consent evidence"
ON public.consent_evidence
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Índices para mejorar el rendimiento
CREATE INDEX idx_consent_evidence_pseudonym ON public.consent_evidence(session_pseudonym);
CREATE INDEX idx_consent_evidence_timestamp ON public.consent_evidence(consent_timestamp);
CREATE INDEX idx_consent_evidence_email ON public.consent_evidence(email);
CREATE INDEX idx_consent_evidence_withdrawn ON public.consent_evidence(withdrawn_at) WHERE withdrawn_at IS NOT NULL;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_consent_evidence_updated_at
BEFORE UPDATE ON public.consent_evidence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Función para registrar acceso a evidencia de consentimiento (se llamará desde el edge function)
CREATE OR REPLACE FUNCTION public.log_consent_evidence_access(
  p_consent_evidence_id UUID,
  p_session_pseudonym TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (event_type, details)
  VALUES (
    'consent_evidence_accessed',
    jsonb_build_object(
      'admin_user_id', auth.uid(),
      'consent_evidence_id', p_consent_evidence_id,
      'session_pseudonym', p_session_pseudonym,
      'access_timestamp', now()
    )
  );
END;
$$;