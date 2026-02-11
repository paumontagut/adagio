import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const SESSIONS_URL = "https://api.openai.com/v1/realtime/sessions";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error('Missing OPENAI_API_KEY environment variable');
      return json({ error: "Falta OPENAI_API_KEY" }, 500);
    }

    // Request body with model configuration
    const sessionConfig = {
      model: "gpt-4o-mini-realtime-preview",
      voice: "alloy",
      instructions: "You are a transcription assistant. Listen to the audio and provide accurate transcriptions."
    };

    console.log('Creating realtime session with config:', sessionConfig);

    const response = await fetch(SESSIONS_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1"
      },
      body: JSON.stringify(sessionConfig),
    });

    const data = await response.json();
    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response data:', data);

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return json({ error: data?.error || data }, response.status);
    }

    if (!data.client_secret?.value) {
      console.error('No client_secret in response:', data);
      return json({ error: "No se pudo obtener el token efímero" }, 500);
    }

    // Return ephemeral token
    return json({
      client_secret: data.client_secret,
      id: data.id,
      expires_at: data.client_secret.expires_at
    }, 200);

  } catch (error) {
    console.error('Error in realtime-ephemeral function:', error);
    return json({ error: String(error) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders },
  });
}