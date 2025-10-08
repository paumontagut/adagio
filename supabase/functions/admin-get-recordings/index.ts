import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parser robusto para audio_url (mismo que en decrypt-download)
function parseAudioUrl(audioUrl: string): { bucket: string; path: string } | null {
  if (!audioUrl) return null;
  
  try {
    const cleanUrl = audioUrl.split('?')[0];
    
    let match = cleanUrl.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+)/);
    if (match) return { bucket: match[1], path: decodeURIComponent(match[2]) };
    
    match = cleanUrl.match(/\/storage\/v1\/object\/authenticated\/([^/]+)\/(.+)/);
    if (match) return { bucket: match[1], path: decodeURIComponent(match[2]) };
    
    match = cleanUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (match) return { bucket: match[1], path: decodeURIComponent(match[2]) };
    
    match = cleanUrl.match(/\/([^/]+)\/(.+)/);
    if (match && (match[1] === 'audio_raw' || match[1] === 'audio_clean')) {
      return { bucket: match[1], path: decodeURIComponent(match[2]) };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing audio_url:', error);
    return null;
  }
}

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

    // Fetch modern recordings from audio_metadata (encrypted storage)
    const { data: audioData, error: audioError } = await supabase
      .from('audio_metadata')
      .select(`
        id,
        session_pseudonym,
        phrase_text,
        audio_format,
        sample_rate,
        duration_ms,
        quality_score,
        consent_train,
        consent_store,
        encryption_key_version,
        file_size_bytes,
        unencrypted_file_size_bytes,
        unencrypted_storage_bucket,
        unencrypted_file_path,
        device_info,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (audioError) {
      console.error('Error fetching audio metadata:', audioError);
    }

    // Fetch legacy recordings from recordings table
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
      console.warn('Warning: Could not fetch legacy recordings:', recordingsError);
    }

    // Create a Set of session_pseudonyms from modern recordings to track them
    const modernPseudonyms = new Set(
      audioData?.map(r => r.session_pseudonym).filter(Boolean) || []
    );

    // Transform modern recordings (from audio_metadata)
    const modernRecordings = (audioData || []).map(audio => ({
      id: audio.id,
      session_pseudonym: audio.session_pseudonym,
      phrase_text: audio.phrase_text,
      audio_url: null, // Modern recordings use encrypted storage
      duration_ms: audio.duration_ms,
      sample_rate: audio.sample_rate,
      format: audio.audio_format,
      audio_format: audio.audio_format,
      consent_train: audio.consent_train,
      consent_store: audio.consent_store,
      device_label: audio.device_info,
      device_info: audio.device_info,
      created_at: audio.created_at,
      consent_at: audio.created_at,
      quality_score: audio.quality_score,
      encryption_key_version: audio.encryption_key_version,
      file_size_bytes: audio.file_size_bytes,
      unencrypted_file_size_bytes: audio.unencrypted_file_size_bytes,
      unencrypted_storage_bucket: audio.unencrypted_storage_bucket,
      unencrypted_file_path: audio.unencrypted_file_path,
      identity_available: audio.session_pseudonym ? true : false,
      source: 'audio_metadata' // Mark as modern
    }));

    // Transform legacy recordings (from recordings table), excluding duplicates
    const legacyRecordings = (recordingsData || [])
      .filter(recording => !recording.session_pseudonym || !modernPseudonyms.has(recording.session_pseudonym))
      .map(recording => {
        // Parse audio_url for legacy recordings
        let unencryptedBucket = null;
        let unencryptedPath = null;
        
        if (recording.audio_url) {
          const parsed = parseAudioUrl(recording.audio_url);
          if (parsed) {
            unencryptedBucket = parsed.bucket;
            unencryptedPath = parsed.path;
          }
        }
        
        return {
          id: recording.id,
          session_pseudonym: recording.session_pseudonym,
          phrase_text: recording.phrase_text,
          audio_url: recording.audio_url,
          duration_ms: recording.duration_ms,
          sample_rate: recording.sample_rate,
          format: recording.format,
          audio_format: recording.format,
          consent_train: recording.consent_train,
          consent_store: recording.consent_store,
          device_label: recording.device_label,
          device_info: recording.device_label,
          created_at: recording.created_at,
          consent_at: recording.consent_at,
          quality_score: null,
          encryption_key_version: 1,
          file_size_bytes: null,
          unencrypted_file_size_bytes: null,
          unencrypted_storage_bucket: unencryptedBucket,
          unencrypted_file_path: unencryptedPath,
          identity_available: recording.session_pseudonym ? true : false,
          source: 'recordings' // Mark as legacy
        };
      });

    // Combine all recordings and sort by created_at
    const enrichedData = [...modernRecordings, ...legacyRecordings]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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