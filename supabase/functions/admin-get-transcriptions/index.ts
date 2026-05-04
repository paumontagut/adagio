import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  sessionToken: string;
  action?: 'list' | 'signed_url' | 'delete';
  audioPath?: string;
  transcriptionId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { sessionToken, action = 'list' } = body;

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Session token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate session
    const { data: sessionData, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('admin_user_id, admin_users!inner(id, email, role, is_active)')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      return new Response(JSON.stringify({ error: 'Invalid or expired admin session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminUser = sessionData.admin_users as unknown as {
      id: string; email: string; role: string; is_active: boolean;
    };
    if (!adminUser?.is_active || !['admin', 'analyst'].includes(adminUser?.role || '')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'signed_url') {
      if (!body.audioPath) {
        return new Response(JSON.stringify({ error: 'audioPath required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data, error } = await supabase.storage
        .from('transcripciones')
        .createSignedUrl(body.audioPath, 60 * 60);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ signedUrl: data?.signedUrl ?? null }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (!body.transcriptionId) {
        return new Response(JSON.stringify({ error: 'transcriptionId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Get audio_path for cleanup
      const { data: row } = await supabase
        .from('transcriptions')
        .select('audio_path')
        .eq('id', body.transcriptionId)
        .maybeSingle();
      if (row?.audio_path) {
        await supabase.storage.from('transcripciones').remove([row.audio_path]);
      }
      const { error: delErr } = await supabase
        .from('transcriptions')
        .delete()
        .eq('id', body.transcriptionId);
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // action = list
    const { data: transcriptions, error: tErr } = await supabase
      .from('transcriptions')
      .select('id, user_id, provider, text, original_text, corrected_text, is_validated, audio_path, audio_format, file_size_bytes, duration_seconds, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (tErr) {
      return new Response(JSON.stringify({ error: tErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: transcriptions ?? [] }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-get-transcriptions:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
