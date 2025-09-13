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

    // Fetch audio metadata with identity information
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
      return new Response(
        JSON.stringify({ error: 'Failed to fetch audio metadata' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch guest verification tokens to get identity information
    const { data: guestData, error: guestError } = await supabase
      .from('guest_verification_tokens')
      .select('session_pseudonym, email, full_name');

    if (guestError) {
      console.warn('Warning: Could not fetch guest data:', guestError);
    }

    // Create a map for quick lookup
    const guestMap = new Map();
    if (guestData) {
      guestData.forEach(guest => {
        guestMap.set(guest.session_pseudonym, {
          email: guest.email,
          full_name: guest.full_name
        });
      });
    }

    // Combine audio metadata with identity information
    const enrichedData = audioData.map(audio => {
      const guestInfo = guestMap.get(audio.session_pseudonym);
      return {
        ...audio,
        email: guestInfo?.email || null,
        full_name: guestInfo?.full_name || null
      };
    });

    console.log(`Returning ${enrichedData.length} recordings for admin ${adminUser.email}`);

    return new Response(
      JSON.stringify({ data: enrichedData }),
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