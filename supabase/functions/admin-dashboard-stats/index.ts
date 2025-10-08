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

    // Get total recordings from recordings table
    const { count: recordingsCount } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true });

    // Get encrypted recordings from audio_metadata
    const { count: encryptedCount } = await supabase
      .from('audio_metadata')
      .select('*', { count: 'exact', head: true });

    // Get unencrypted recordings (those with unencrypted_file_path)
    const { count: unencryptedCount } = await supabase
      .from('audio_metadata')
      .select('*', { count: 'exact', head: true })
      .not('unencrypted_file_path', 'is', null);

    // Get total users
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get recordings from today
    const today = new Date().toISOString().split('T')[0];
    const { data: todayRecordings } = await supabase
      .from('audio_metadata')
      .select('id')
      .gte('created_at', today);

    // Get consented recordings
    const { data: consentedData } = await supabase
      .from('audio_metadata')
      .select('consent_train, consent_store');

    const consentedCount = consentedData?.filter(r => r.consent_train || r.consent_store).length || 0;

    // Get average duration
    const { data: durationData } = await supabase
      .from('audio_metadata')
      .select('duration_ms')
      .not('duration_ms', 'is', null);

    const avgDuration = durationData?.reduce((acc, r) => acc + (r.duration_ms || 0), 0) / (durationData?.length || 1) / 1000;

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('admin_activity_log')
      .select('*, admin_users(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(10);

    const stats = {
      totalRecordings: (recordingsCount || 0) + (encryptedCount || 0),
      encryptedRecordings: (encryptedCount || 0) - (unencryptedCount || 0),
      unencryptedRecordings: unencryptedCount || 0,
      totalUsers: usersCount || 0,
      todayRecordings: todayRecordings?.length || 0,
      consentedRecordings: consentedCount,
      averageDuration: Math.round(avgDuration || 0),
      recentActivity: recentActivity || []
    };

    console.log('Dashboard stats generated for admin:', adminUser.role);

    return new Response(
      JSON.stringify(stats),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-dashboard-stats:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
