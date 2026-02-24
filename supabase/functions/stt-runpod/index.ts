import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_TIME_MS = 180000; // 3 minutes max
const TEMP_BUCKET = 'audio_raw';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RUNPOD_API_KEY = Deno.env.get('RUNPOD_API_KEY');
    if (!RUNPOD_API_KEY) throw new Error('RUNPOD_API_KEY is not configured');

    const RUNPOD_ENDPOINT_ID = Deno.env.get('RUNPOD_ENDPOINT_ID');
    if (!RUNPOD_ENDPOINT_ID) throw new Error('RUNPOD_ENDPOINT_ID is not configured');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase config missing');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    // Upload to Supabase Storage to get a real URL
    const tempFileName = `temp-stt/${crypto.randomUUID()}.wav`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(TEMP_BUCKET)
      .upload(tempFileName, arrayBuffer, { contentType: 'audio/wav', upsert: true });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload audio temporarily' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a signed URL valid for 10 minutes
    const { data: signedData, error: signError } = await supabase.storage
      .from(TEMP_BUCKET)
      .createSignedUrl(tempFileName, 600);

    if (signError || !signedData?.signedUrl) {
      console.error('Signed URL error:', signError);
      return new Response(
        JSON.stringify({ error: 'Failed to create signed URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioUrl = signedData.signedUrl;
    console.log(`Submitting async job with audio URL, file size: ${arrayBuffer.byteLength} bytes`);

    // Step 1: Submit async job with a real URL
    const submitResponse = await fetch(RUNPOD_RUN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          audio_url: audioUrl,
          language: 'es',
          task: 'transcribe',
        },
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error(`RunPod submit error [${submitResponse.status}]:`, errorText);
      await cleanupTempFile(supabase, tempFileName);
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
      await cleanupTempFile(supabase, tempFileName);
      return buildSuccessResponse(submitResult);
    }

    if (submitResult.status === 'FAILED') {
      console.error('Job immediately FAILED:', JSON.stringify(submitResult));
      await cleanupTempFile(supabase, tempFileName);
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
        continue;
      }

      const statusResult = await statusResponse.json();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Poll ${elapsed}s - status: ${statusResult.status}`);

      if (statusResult.status === 'COMPLETED') {
        await cleanupTempFile(supabase, tempFileName);
        return buildSuccessResponse(statusResult);
      }

      if (statusResult.status === 'FAILED') {
        console.error('Job FAILED:', JSON.stringify(statusResult));
        await cleanupTempFile(supabase, tempFileName);
        return new Response(
          JSON.stringify({ error: 'Transcription failed on RunPod', details: statusResult.error || 'Unknown error' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (statusResult.status === 'CANCELLED') {
        await cleanupTempFile(supabase, tempFileName);
        return new Response(
          JSON.stringify({ error: 'Transcription was cancelled' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Timeout
    await cleanupTempFile(supabase, tempFileName);
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

async function cleanupTempFile(supabase: any, path: string) {
  try {
    await supabase.storage.from(TEMP_BUCKET).remove([path]);
  } catch (e) {
    console.warn('Failed to cleanup temp file:', e);
  }
}

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
}
