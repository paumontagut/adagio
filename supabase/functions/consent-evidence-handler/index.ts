import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      session_pseudonym,
      full_name,
      email,
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
    if (!session_pseudonym || !full_name || !age_range || !country || !region) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Guardar evidencia de consentimiento en la tabla unificada
    const { data: consentEvidence, error: insertError } = await supabase
      .from('participant_consents')
      .insert({
        session_pseudonym,
        full_name,
        email,
        age_range,
        country,
        region,
        adult_declaration,
        adult_declaration_timestamp: new Date().toISOString(),
        consent_train: consent_train || false,
        consent_store: consent_store || false,
        consent_timestamp: new Date().toISOString(),
        consent_evidence_data,
        digital_signature,
        ip_address,
        user_agent,
        device_info
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting consent evidence:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save consent evidence', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log el evento en audit_logs
    await supabase
      .from('audit_logs')
      .insert({
        event_type: 'consent_evidence_created',
        details: {
          consent_evidence_id: consentEvidence.id,
          session_pseudonym,
          adult_declaration,
          consent_train,
          consent_store,
          digital_signature,
          timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        consent_evidence_id: consentEvidence.id,
        digital_signature
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in consent-evidence-handler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});