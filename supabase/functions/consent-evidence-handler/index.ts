import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generatePseudonym(sessionId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(sessionId + '_pseudonym_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `ps_${hashHex.substring(0, 16)}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      session_pseudonym: rawSessionId,
      full_name,
      email,
      user_id,
      age_range,
      country,
      region,
      adult_declaration,
      consent_train,
      consent_store,
      consent_evidence_data,
      ip_address,
      user_agent,
      device_info
    } = await req.json();

    // Validar que todos los campos obligatorios están presentes
    if (!rawSessionId || !full_name || !age_range || !country || !region) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate the same deterministic pseudonym used by encrypted-audio-api
    const session_pseudonym = await generatePseudonym(rawSessionId);

    // Validar declaración de mayoría de edad
    if (!adult_declaration) {
      return new Response(
        JSON.stringify({ error: 'Adult declaration is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generar firma digital del consentimiento (hash SHA-256)
    const consentString = JSON.stringify({
      session_pseudonym,
      full_name,
      age_range,
      country,
      region,
      adult_declaration,
      consent_train,
      consent_store,
      timestamp: new Date().toISOString()
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(consentString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const digital_signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Guardar evidencia de consentimiento en la tabla
    const enrichedEvidenceData = {
      ...consent_evidence_data,
      digital_signature,
      consent_timestamp: new Date().toISOString()
    };

    const { data: consentEvidence, error: insertError } = await supabase
      .from('participant_consents')
      .insert({
        session_pseudonym,
        full_name,
        email,
        user_id: user_id || null,
        age_range,
        country,
        region,
        adult_declaration,
        consent_train: consent_train || false,
        consent_store: consent_store || false,
        consent_evidence_data: enrichedEvidenceData,
        ip_address,
        user_agent,
        device_info
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('Error inserting consent evidence:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save consent evidence', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Consent evidence saved successfully:', {
      consent_evidence_id: consentEvidence?.id,
      session_pseudonym,
      consent_train,
      consent_store
    });

    return new Response(
      JSON.stringify({
        success: true,
        consent_evidence_id: consentEvidence.id,
        digital_signature
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in consent-evidence-handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});