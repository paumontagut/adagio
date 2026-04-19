-- Tabla de feedback de transcripciones (privada por usuario)
CREATE TABLE public.transcription_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('adagio', 'openai')),
  predicted_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  corrected_text TEXT,
  audio_path TEXT,
  duration_seconds INTEGER,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_transcription_feedback_user_provider 
  ON public.transcription_feedback(user_id, provider);
CREATE INDEX idx_transcription_feedback_created_at 
  ON public.transcription_feedback(created_at DESC);

ALTER TABLE public.transcription_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON public.transcription_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON public.transcription_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
  ON public.transcription_feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access transcription_feedback"
  ON public.transcription_feedback FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Tabla de puntos del usuario (gamificación visible)
CREATE TABLE public.user_points (
  user_id UUID NOT NULL PRIMARY KEY,
  total_points INTEGER NOT NULL DEFAULT 0,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  corrections_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points"
  ON public.user_points FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access user_points"
  ON public.user_points FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Trigger function: calcula puntos y actualiza user_points
CREATE OR REPLACE FUNCTION public.award_points_on_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pts INTEGER;
  is_correction BOOLEAN;
BEGIN
  -- Determinar puntos: +15 si hay corrección manual, +5 si solo validación
  is_correction := (NEW.corrected_text IS NOT NULL AND length(trim(NEW.corrected_text)) > 0);
  pts := CASE WHEN is_correction THEN 15 ELSE 5 END;

  -- Guardar puntos en la propia fila del feedback
  NEW.points_awarded := pts;

  -- Upsert en user_points
  INSERT INTO public.user_points (user_id, total_points, feedback_count, corrections_count, updated_at)
  VALUES (
    NEW.user_id,
    pts,
    1,
    CASE WHEN is_correction THEN 1 ELSE 0 END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = public.user_points.total_points + pts,
    feedback_count = public.user_points.feedback_count + 1,
    corrections_count = public.user_points.corrections_count + 
      CASE WHEN is_correction THEN 1 ELSE 0 END,
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_points_on_feedback
BEFORE INSERT ON public.transcription_feedback
FOR EACH ROW
EXECUTE FUNCTION public.award_points_on_feedback();