import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  sessionToken: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionToken }: RequestBody = await req.json();

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Session token is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Validating admin session token...');

    // Validate session token
    const { data: sessionData, error: sessionError } = await supabase
      .from('admin_sessions')
      .select(`
        admin_user_id,
        admin_users!inner(
          id,
          email,
          full_name,
          role,
          is_active
        )
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      console.error('Invalid session token:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired admin session' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const adminUser = sessionData.admin_users;
    if (!adminUser.is_active || !['admin', 'analyst'].includes(adminUser.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Admin access granted for: ${adminUser.email} (${adminUser.role})`);

    // Fetch recordings with pseudonyms (separación de datos)
    const { data: recordingsData, error: recordingsError } = await supabase
      .from('recordings')
      .select(`
        id,
        session_pseudonym,
        phrase_text,
        audio_url,
        duration_ms,
        sample_rate,
        format,
        consent_train,
        consent_store,
        device_label,
        created_at,
        consent_at
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (recordingsError) {
      console.error('Error fetching recordings:', recordingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch recordings' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch audio metadata separately (for technical details)
    const { data: audioData, error: audioError } = await supabase
      .from('audio_metadata')
      .select(`
        id,
        session_pseudonym,
        audio_format,
        sample_rate,
        duration_ms,
        quality_score,
        encryption_key_version,
        file_size_bytes,
        unencrypted_file_size_bytes,
        unencrypted_storage_bucket,
        unencrypted_file_path,
        device_info
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (audioError) {
      console.warn('Warning: Could not fetch audio metadata:', audioError);
    }

    // Create maps for quick lookup
    const audioMap = new Map();
    if (audioData) {
      audioData.forEach(audio => {
        audioMap.set(audio.session_pseudonym, audio);
      });
    }

    // SEPARACIÓN DE DATOS: Solo devolver pseudónimos, NO nombres reales
    // Los nombres se obtienen por separado cuando se necesiten específicamente
    const enrichedData = recordingsData.map(recording => {
      const audioInfo = audioMap.get(recording.session_pseudonym);
      return {
        // Datos de grabación (tabla recordings)
        id: recording.id,
        session_pseudonym: recording.session_pseudonym,
        phrase_text: recording.phrase_text,
        audio_url: recording.audio_url,
        duration_ms: recording.duration_ms,
        sample_rate: recording.sample_rate,
        format: recording.format,
        consent_train: recording.consent_train,
        consent_store: recording.consent_store,
        device_label: recording.device_label,
        created_at: recording.created_at,
        consent_at: recording.consent_at,
        
        // Datos técnicos de audio_metadata (si están disponibles)
        audio_format: audioInfo?.audio_format || recording.format,
        quality_score: audioInfo?.quality_score || null,
        encryption_key_version: audioInfo?.encryption_key_version || 1,
        file_size_bytes: audioInfo?.file_size_bytes || null,
        unencrypted_file_size_bytes: audioInfo?.unencrypted_file_size_bytes || null,
        unencrypted_storage_bucket: audioInfo?.unencrypted_storage_bucket || null,
        unencrypted_file_path: audioInfo?.unencrypted_file_path || null,
        device_info: audioInfo?.device_info || recording.device_label,
        
        // IMPORTANTE: NO incluir email ni full_name directamente
        // Esto garantiza la separación de datos
        identity_available: recording.session_pseudonym ? true : false
      };
    });

    console.log(`Returning ${enrichedData.length} recordings for admin ${adminUser.email} (pseudonyms only, identity data separated)`);

    return new Response(
      JSON.stringify({ 
        data: enrichedData,
        privacy_note: "Identity data (names/emails) separated for privacy - use identity lookup function if needed"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in admin-get-recordings:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});