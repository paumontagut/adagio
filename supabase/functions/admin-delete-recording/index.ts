import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recordingId, sessionToken } = await req.json();
    if (!recordingId || !sessionToken) {
      return json({ error: 'Missing recordingId or sessionToken' }, 400);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('Missing Supabase env vars');
      return json({ error: 'Server not configured' }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Validate admin session
    const { data: session, error: sessionErr } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionErr) {
      console.error('Session error:', sessionErr);
      return json({ error: 'Auth error' }, 401);
    }
    if (!session) {
      return json({ error: 'Invalid or expired session' }, 401);
    }

    // Check role is admin
    const { data: admin, error: adminErr } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', session.admin_user_id)
      .maybeSingle();

    if (adminErr || !admin || admin.role !== 'admin') {
      return json({ error: 'Forbidden' }, 403);
    }

    // Load metadata
    const { data: meta, error: metaErr } = await supabase
      .from('audio_metadata')
      .select('id, unencrypted_file_path, unencrypted_storage_bucket')
      .eq('id', recordingId)
      .maybeSingle();

    if (metaErr || !meta) {
      return json({ error: 'Recording not found' }, 404);
    }

    // Delete encrypted files rows
    const { data: encRows, error: encSelErr } = await supabase
      .from('encrypted_audio_files')
      .select('id')
      .eq('metadata_id', recordingId);

    if (encSelErr) {
      console.error('Encrypted select error:', encSelErr);
    } else if (encRows && encRows.length) {
      const { error: encDelErr } = await supabase
        .from('encrypted_audio_files')
        .delete()
        .in('id', encRows.map(r => r.id));
      if (encDelErr) console.error('Encrypted delete error:', encDelErr);
    }

    // Delete unencrypted object from storage if exists
    if (meta.unencrypted_file_path && meta.unencrypted_storage_bucket) {
      const { error: remErr } = await supabase
        .storage
        .from(meta.unencrypted_storage_bucket)
        .remove([meta.unencrypted_file_path]);
      if (remErr) console.error('Storage remove error:', remErr);
    }

    // Delete audio_metadata row
    const { error: metaDelErr } = await supabase
      .from('audio_metadata')
      .delete()
      .eq('id', recordingId);

    if (metaDelErr) {
      console.error('Metadata delete error:', metaDelErr);
      return json({ error: 'Failed to delete metadata' }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error in admin-delete-recording:', error);
    return json({ error: String(error) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders }
  });
}
