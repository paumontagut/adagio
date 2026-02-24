import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_TIME_MS = 180000; // 3 minutes max

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RUNPOD_API_KEY = Deno.env.get('RUNPOD_API_KEY');
    if (!RUNPOD_API_KEY) throw new Error('RUNPOD_API_KEY is not configured');

    const RUNPOD_ENDPOINT_ID = Deno.env.get('RUNPOD_ENDPOINT_ID');
    if (!RUNPOD_ENDPOINT_ID) throw new Error('RUNPOD_ENDPOINT_ID is not configured');

    // Use /run (async) instead of /runsync to handle cold starts
    const RUNPOD_RUN_URL = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/run`;
    const RUNPOD_STATUS_URL = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/status`;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to base64 (chunked to avoid stack overflow)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64Audio = btoa(binary);

    console.log(`Submitting async job, audio size: ${uint8Array.length} bytes`);

    // Step 1: Submit async job
    const submitResponse = await fetch(RUNPOD_RUN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          audio_url: `data:audio/wav;base64,${base64Audio}`,
          language: 'es',
          task: 'transcribe',
        },
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error(`RunPod submit error [${submitResponse.status}]:`, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to submit transcription job' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const submitResult = await submitResponse.json();
    const jobId = submitResult.id;
    console.log(`Job submitted: ${jobId}, status: ${submitResult.status}`);

    // If already completed (warm worker)
    if (submitResult.status === 'COMPLETED' && submitResult.output) {
      return buildSuccessResponse(submitResult);
    }

    if (submitResult.status === 'FAILED') {
      console.error('Job immediately FAILED:', JSON.stringify(submitResult));
      return new Response(
        JSON.stringify({ error: 'Transcription failed', details: submitResult.error || 'Unknown error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Poll for completion
    const startTime = Date.now();
    while (Date.now() - startTime < MAX_POLL_TIME_MS) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      const statusResponse = await fetch(`${RUNPOD_STATUS_URL}/${jobId}`, {
        headers: { 'Authorization': `Bearer ${RUNPOD_API_KEY}` },
      });

      if (!statusResponse.ok) {
        const errText = await statusResponse.text();
        console.error(`Status poll error [${statusResponse.status}]:`, errText);
        continue; // retry
      }

      const statusResult = await statusResponse.json();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Poll ${elapsed}s - status: ${statusResult.status}`);

      if (statusResult.status === 'COMPLETED') {
        return buildSuccessResponse(statusResult);
      }

      if (statusResult.status === 'FAILED') {
        console.error('Job FAILED:', JSON.stringify(statusResult));
        return new Response(
          JSON.stringify({ error: 'Transcription failed on RunPod', details: statusResult.error || 'Unknown error' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (statusResult.status === 'CANCELLED') {
        return new Response(
          JSON.stringify({ error: 'Transcription was cancelled' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // IN_QUEUE or IN_PROGRESS → keep polling
    }

    // Timeout after MAX_POLL_TIME_MS
    return new Response(
      JSON.stringify({ error: 'Transcription timed out after polling', details: `Waited ${MAX_POLL_TIME_MS / 1000}s` }),
      { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

function buildSuccessResponse(result: any): Response {
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
  if (!transcriptionText && result.text) {
    transcriptionText = result.text;
  }

  if (!transcriptionText) {
    console.error('Empty transcription from RunPod:', JSON.stringify(result));
    return new Response(
      JSON.stringify({ error: 'No transcription text returned', details: JSON.stringify(result) }),
      { status: 502, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      text: transcriptionText,
      segments: result.output?.segments || [],
      status: result.status,
    }),
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  );
}
