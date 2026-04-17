import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MODAL_URL = 'https://info-70529--adagio-adagio-transcribe.modal.run';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detect audio format from filename extension or content-type
    const audioFormat = detectAudioFormat(file);

    // Convert audio to base64 for Modal worker
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    const audioBase64 = btoa(binaryString);

    console.log(`Submitting to Modal, file size: ${arrayBuffer.byteLength} bytes, format: ${audioFormat}, name: ${file.name}, type: ${file.type}`);

    // Synchronous call to Modal
    const response = await fetch(MODAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_base64: audioBase64,
        language: 'es',
        task: 'transcribe',
        format: audioFormat,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Modal error [${response.status}]:`, errorText);
      return new Response(
        JSON.stringify({ error: 'Transcription failed', details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('Modal response received');

    return buildSuccessResponse(result);

  } catch (error: unknown) {
    const correlationId = crypto.randomUUID();
    console.error(`Error [${correlationId}] in stt-runpod:`, error);
    return new Response(
      JSON.stringify({ error: 'Operation failed', correlationId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function detectAudioFormat(file: File): string {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();

  // 1. Try filename extension first (most reliable)
  const extMatch = name.match(/\.([a-z0-9]+)$/);
  if (extMatch) {
    const ext = extMatch[1];
    if (ext === 'm4a' || ext === 'mp4') return 'm4a';
    if (ext === 'wav') return 'wav';
    if (ext === 'mp3') return 'mp3';
    if (ext === 'webm') return 'webm';
    if (ext === 'ogg' || ext === 'opus') return 'ogg';
    if (ext === 'flac') return 'flac';
  }

  // 2. Fallback to content-type
  if (type.includes('mp4') || type.includes('m4a') || type.includes('aac')) return 'm4a';
  if (type.includes('wav') || type.includes('wave') || type.includes('x-wav')) return 'wav';
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3';
  if (type.includes('webm')) return 'webm';
  if (type.includes('ogg') || type.includes('opus')) return 'ogg';
  if (type.includes('flac')) return 'flac';

  // 3. Default
  return 'wav';
}

function buildSuccessResponse(result: any): Response {
  let transcriptionText = '';
  let segments: any[] = [];

  if (result) {
    if (typeof result === 'string') {
      transcriptionText = result;
    } else if (typeof result.text === 'string') {
      transcriptionText = result.text;
    } else if (typeof result.transcription === 'string') {
      transcriptionText = result.transcription;
    } else if (result.output) {
      if (typeof result.output === 'string') {
        transcriptionText = result.output;
      } else if (typeof result.output.text === 'string') {
        transcriptionText = result.output.text;
      } else if (typeof result.output.transcription === 'string') {
        transcriptionText = result.output.transcription;
      }
      segments = result.output?.segments || [];
    }
    if (!segments.length && Array.isArray(result.segments)) {
      segments = result.segments;
    }
  }

  if (!transcriptionText) {
    console.error('Empty transcription from Modal:', JSON.stringify(result));
    return new Response(
      JSON.stringify({ error: 'No transcription text returned', details: JSON.stringify(result) }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      text: transcriptionText,
      segments,
      status: 'COMPLETED',
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
