import { supabase } from '@/integrations/supabase/client';

export type TranscriptionProvider = 'adagio' | 'openai';

export interface SaveTranscriptionParams {
  provider: TranscriptionProvider;
  text: string;
  audioBlob?: Blob | null;
  durationSec?: number | null;
}

export interface SavedTranscription {
  id: string;
  audioPath: string | null;
}

const BUCKET = 'transcripciones';

function inferExtension(mime: string): string {
  if (!mime) return 'wav';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('ogg')) return 'ogg';
  return 'wav';
}

/**
 * Guarda una transcripción del apartado "Transcribir".
 * - Sube el audio a `transcripciones/{user_id}/{id}.{ext}` si data_use_consent=true.
 * - Inserta fila en `transcriptions` con provider, texto original, etc.
 * Si el usuario no está logueado, no hace nada y devuelve null.
 */
export async function saveTranscription(
  params: SaveTranscriptionParams
): Promise<SavedTranscription | null> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return null;

  // Comprobar consentimiento para guardar audio
  let canStoreAudio = false;
  if (params.audioBlob) {
    const { data: consent } = await supabase
      .from('user_consents')
      .select('data_use_consent')
      .eq('user_id', user.id)
      .maybeSingle();
    canStoreAudio = !!consent?.data_use_consent;
  }

  const transcriptionId = crypto.randomUUID();
  let audioPath: string | null = null;
  let audioFormat: string | null = null;
  let fileSize: number | null = null;

  if (canStoreAudio && params.audioBlob) {
    const ext = inferExtension(params.audioBlob.type);
    const path = `${user.id}/${transcriptionId}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, params.audioBlob, {
        contentType: params.audioBlob.type || 'audio/wav',
        upsert: false,
      });
    if (!upErr) {
      audioPath = path;
      audioFormat = params.audioBlob.type || `audio/${ext}`;
      fileSize = params.audioBlob.size;
    } else {
      console.warn('No se pudo subir audio de transcripción:', upErr.message);
    }
  }

  const { data: inserted, error: insErr } = await supabase
    .from('transcriptions')
    .insert({
      id: transcriptionId,
      user_id: user.id,
      provider: params.provider,
      text: params.text,
      original_text: params.text,
      audio_path: audioPath,
      audio_format: audioFormat,
      file_size_bytes: fileSize,
      duration_seconds: params.durationSec ? Math.round(params.durationSec) : null,
    })
    .select('id, audio_path')
    .single();

  if (insErr || !inserted) {
    console.error('Error guardando transcripción:', insErr);
    return null;
  }

  return { id: inserted.id, audioPath: inserted.audio_path };
}

/**
 * Actualiza una transcripción cuando el usuario da feedback.
 * - is_validated=true → marcar correcta
 * - corrected_text → actualizar text con la corrección
 */
export async function updateTranscriptionFeedback(
  transcriptionId: string,
  params: { isCorrect: boolean; correctedText?: string | null; feedbackId?: string | null }
): Promise<void> {
  const update: Record<string, unknown> = {
    is_validated: params.isCorrect,
  };
  if (params.feedbackId) update.feedback_id = params.feedbackId;
  if (params.correctedText && params.correctedText.trim().length > 0) {
    const corrected = params.correctedText.trim();
    update.corrected_text = corrected;
    update.text = corrected;
  }
  const { error } = await supabase
    .from('transcriptions')
    .update(update)
    .eq('id', transcriptionId);
  if (error) console.warn('No se pudo actualizar transcripción:', error.message);
}

export interface MyTranscriptionRow {
  id: string;
  created_at: string;
  updated_at: string;
  provider: string | null;
  text: string;
  original_text: string | null;
  corrected_text: string | null;
  is_validated: boolean | null;
  audio_path: string | null;
  duration_seconds: number | null;
}

export async function listMyTranscriptions(): Promise<MyTranscriptionRow[]> {
  const { data, error } = await supabase
    .from('transcriptions')
    .select('id, created_at, updated_at, provider, text, original_text, corrected_text, is_validated, audio_path, duration_seconds')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as MyTranscriptionRow[];
}

export async function deleteTranscription(id: string, audioPath?: string | null): Promise<void> {
  if (audioPath) {
    await supabase.storage.from(BUCKET).remove([audioPath]);
  }
  const { error } = await supabase.from('transcriptions').delete().eq('id', id);
  if (error) throw error;
}

export async function getTranscriptionAudioUrl(audioPath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(audioPath, 60 * 60);
  if (error) {
    console.warn('No se pudo crear signed URL:', error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}
