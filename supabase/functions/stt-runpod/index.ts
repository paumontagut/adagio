import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RUNPOD_API_KEY = Deno.env.get('RUNPOD_API_KEY');
    if (!RUNPOD_API_KEY) {
      throw new Error('RUNPOD_API_KEY is not configured');
    }

    const RUNPOD_ENDPOINT_ID = Deno.env.get('RUNPOD_ENDPOINT_ID');
    if (!RUNPOD_ENDPOINT_ID) {
      throw new Error('RUNPOD_ENDPOINT_ID is not configured');
    }

    const RUNPOD_URL = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/runsync`;

    // Parse multipart form data to get the audio file
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to base64 for RunPod (chunked to avoid stack overflow)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64Audio = btoa(binary);

    // Call RunPod Whisper endpoint
    const response = await fetch(RUNPOD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          audio_base64: base64Audio,
          language: 'es',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RunPod API error [${response.status}]:`, errorText);
      return new Response(
        JSON.stringify({ error: 'Transcription service error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();

    console.log('RunPod response status:', result.status);
    console.log('RunPod output type:', typeof result.output, result.output ? Object.keys(result.output) : 'null');

    // Check if RunPod reported a failure
    if (result.status === 'FAILED') {
      console.error('RunPod job FAILED:', JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: 'Transcription failed on RunPod', details: result.error || result.output || 'Unknown error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // RunPod returns { output: { text: "...", segments: [...] } } or { output: "..." }
    let transcriptionText = '';
    if (result.output) {
      if (typeof result.output === 'string') {
        transcriptionText = result.output;
      } else if (result.output.text) {
        transcriptionText = result.output.text;
      } else if (result.output.transcription) {
        transcriptionText = result.output.transcription;
      }
    }

    // Also check for direct text field
    if (!transcriptionText && result.text) {
      transcriptionText = result.text;
    }

    if (!transcriptionText) {
      console.error('Empty transcription from RunPod:', JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: 'No transcription text returned', details: JSON.stringify(result) }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        text: transcriptionText,
        segments: result.output?.segments || [],
        status: result.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const correlationId = crypto.randomUUID();
    console.error(`Error [${correlationId}] in stt-runpod:`, error);
    return new Response(
      JSON.stringify({ error: 'Operation failed', correlationId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
