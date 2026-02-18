import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionToken } = await req.json();

    // Validate admin session
    const { data: sessionData, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('admin_user_id, admin_users!inner(role, is_active)')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: 'Invalid admin session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminUser = sessionData.admin_users as any;
    if (!adminUser.is_active || !['admin', 'analyst'].includes(adminUser.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recordings from audio_metadata (modern encrypted)
    const { data: modernRecordings } = await supabase
      .from('audio_metadata')
      .select('id, session_pseudonym, consent_train, consent_store, duration_ms, unencrypted_file_path, created_at');

    // Get recordings from recordings table (legacy)
    const { data: legacyRecordings } = await supabase
      .from('recordings')
      .select('id, session_pseudonym, consent_train, consent_store, duration_ms, created_at');

    // Create a Set of session_pseudonyms from modern recordings to avoid duplicates
    const modernPseudonyms = new Set(
      modernRecordings?.map(r => r.session_pseudonym).filter(Boolean) || []
    );

    // Filter legacy recordings to exclude those that exist in modern
    const uniqueLegacyRecordings = legacyRecordings?.filter(
      r => r.session_pseudonym && !modernPseudonyms.has(r.session_pseudonym)
    ) || [];

    // Combine all unique recordings
    const allRecordings = [
      ...(modernRecordings || []),
      ...uniqueLegacyRecordings
    ];

    // Count encrypted vs unencrypted from modern recordings
    const encryptedCount = modernRecordings?.filter(r => !r.unencrypted_file_path).length || 0;
    const unencryptedCount = modernRecordings?.filter(r => r.unencrypted_file_path).length || 0;

    // Get total users
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get recordings from today
    const today = new Date().toISOString().split('T')[0];
    const todayRecordings = allRecordings.filter(r => 
      r.created_at && new Date(r.created_at).toISOString().split('T')[0] === today
    );

    // Get consented recordings
    const consentedCount = allRecordings.filter(r => r.consent_train || r.consent_store).length;

    // Get average duration from all recordings
    const durationsWithValue = allRecordings.filter(r => r.duration_ms && r.duration_ms > 0);
    const avgDuration = durationsWithValue.length > 0
      ? durationsWithValue.reduce((acc, r) => acc + (r.duration_ms || 0), 0) / durationsWithValue.length / 1000
      : 0;

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('admin_activity_log')
      .select('*, admin_users(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(10);

    const stats = {
      totalRecordings: allRecordings.length,
      encryptedRecordings: encryptedCount,
      unencryptedRecordings: unencryptedCount,
      legacyRecordings: uniqueLegacyRecordings.length,
      totalUsers: usersCount || 0,
      todayRecordings: todayRecordings.length,
      consentedRecordings: consentedCount,
      averageDuration: Math.round(avgDuration),
      recentActivity: recentActivity || []
    };

    console.log('Dashboard stats generated for admin:', adminUser.role);

    return new Response(
      JSON.stringify(stats),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const correlationId = crypto.randomUUID();
    console.error(`Error [${correlationId}] in admin-dashboard-stats:`, error);
    return new Response(
      JSON.stringify({ error: 'Operation failed', correlationId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
