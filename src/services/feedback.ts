import { supabase } from '@/integrations/supabase/client';

export type FeedbackProvider = 'adagio' | 'openai';

export interface SaveFeedbackParams {
  provider: FeedbackProvider;
  predictedText: string;
  isCorrect: boolean;
  correctedText?: string | null;
  audioBlob?: Blob | null;
  durationSec?: number | null;
}

export interface SaveFeedbackResult {
  feedbackId: string;
  pointsAwarded: number;
  audioUploaded: boolean;
}

/**
 * Guarda feedback de transcripción y, si el usuario tiene `data_use_consent = true`,
 * sube el audio etiquetado al bucket `inferencias`. Los puntos los calcula un trigger
 * en la BD (5 por validación, 15 si hay corrección manual).
 */
export async function saveFeedback(
  params: SaveFeedbackParams
): Promise<SaveFeedbackResult> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) {
    throw new Error('Debes iniciar sesión para enviar feedback.');
  }
  const user = userRes.user;

  const corrected =
    params.correctedText && params.correctedText.trim().length > 0
      ? params.correctedText.trim()
      : null;

  // Comprobar consentimiento de uso de datos
  let canStoreAudio = false;
  if (params.audioBlob) {
    const { data: consent } = await supabase
      .from('user_consents')
      .select('data_use_consent')
      .eq('user_id', user.id)
      .maybeSingle();
    canStoreAudio = !!consent?.data_use_consent;
  }

  // Subir audio si procede
  let audioPath: string | null = null;
  let audioUploaded = false;
  if (canStoreAudio && params.audioBlob) {
    const ext = inferExtension(params.audioBlob.type);
    const tempId = crypto.randomUUID();
    const path = `${user.id}/feedback/${tempId}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from('inferencias')
      .upload(path, params.audioBlob, {
        contentType: params.audioBlob.type || 'audio/wav',
        upsert: false,
      });
    if (!uploadErr) {
      audioPath = path;
      audioUploaded = true;
    } else {
      console.warn('No se pudo subir el audio de feedback:', uploadErr.message);
    }
  }

  // Insertar feedback (el trigger calcula y devuelve points_awarded)
  const { data: inserted, error: insertErr } = await supabase
    .from('transcription_feedback')
    .insert({
      user_id: user.id,
      provider: params.provider,
      predicted_text: params.predictedText,
      is_correct: params.isCorrect,
      corrected_text: corrected,
      audio_path: audioPath,
      duration_seconds: params.durationSec ?? null,
    })
    .select('id, points_awarded')
    .single();

  if (insertErr || !inserted) {
    throw new Error(insertErr?.message || 'No se pudo guardar el feedback.');
  }

  return {
    feedbackId: inserted.id,
    pointsAwarded: inserted.points_awarded,
    audioUploaded,
  };
}

function inferExtension(mime: string): string {
  if (!mime) return 'wav';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('ogg')) return 'ogg';
  return 'wav';
}
