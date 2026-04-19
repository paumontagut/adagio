-- Crear el trigger que faltaba para otorgar puntos automáticamente al insertar feedback
DROP TRIGGER IF EXISTS trg_award_points_on_feedback ON public.transcription_feedback;

CREATE TRIGGER trg_award_points_on_feedback
  BEFORE INSERT ON public.transcription_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_on_feedback();

-- Backfill: otorgar puntos por el feedback ya existente que no recibió puntos
INSERT INTO public.user_points (user_id, total_points, feedback_count, corrections_count, updated_at)
SELECT 
  user_id,
  SUM(CASE WHEN corrected_text IS NOT NULL AND length(trim(corrected_text)) > 0 THEN 15 ELSE 5 END),
  COUNT(*),
  COUNT(*) FILTER (WHERE corrected_text IS NOT NULL AND length(trim(corrected_text)) > 0),
  now()
FROM public.transcription_feedback
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_points = EXCLUDED.total_points,
  feedback_count = EXCLUDED.feedback_count,
  corrections_count = EXCLUDED.corrections_count,
  updated_at = now();