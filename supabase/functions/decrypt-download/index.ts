import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { decodeBase64 as b64decode, encodeBase64 as b64encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type UUID = string;

interface DecryptRequest {
  recordingId: UUID;
  sessionToken: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      return json({ error: 'Missing Supabase env vars' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const { recordingId, sessionToken }: DecryptRequest = await req.json();
    if (!recordingId || !sessionToken) {
      return json({ error: 'recordingId and sessionToken are required' }, 400);
    }

    // 1) Validate session
    const { data: session, error: sessionErr } = await supabase
      .from('admin_sessions')
      .select('admin_user_id, expires_at')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionErr) return json({ error: sessionErr.message }, 401);
    if (!session) return json({ error: 'Invalid session' }, 401);

    const { data: admin, error: adminErr } = await supabase
      .from('admin_users')
      .select('id, role, is_active')
      .eq('id', session.admin_user_id)
      .maybeSingle();

    if (adminErr) return json({ error: adminErr.message }, 401);
    if (!admin || !admin.is_active || admin.role !== 'admin') {
      return json({ error: 'Unauthorized' }, 401);
    }

    // 2) Load metadata
    const { data: meta, error: metaErr } = await supabase
      .from('audio_metadata')
      .select('*')
      .eq('id', recordingId)
      .maybeSingle();

    if (metaErr) return json({ error: metaErr.message }, 404);
    if (!meta) return json({ error: 'Recording not found' }, 404);

    // 3) Load encrypted file
    const { data: enc, error: encErr } = await supabase
      .from('encrypted_audio_files')
      .select('*')
      .eq('metadata_id', recordingId)
      .maybeSingle();

    if (encErr) return json({ error: encErr.message }, 404);
    if (!enc) return json({ error: 'Encrypted file not found' }, 404);

    // 4) Load key by version (may be inactive but must match recording version)
    const { data: keyRec, error: keyErr } = await supabase
      .from('encryption_keys')
      .select('key_hash')
      .eq('version', meta.encryption_key_version)
      .maybeSingle();

    if (keyErr) return json({ error: keyErr.message }, 404);
    if (!keyRec) return json({ error: 'Encryption key not found for version ' + meta.encryption_key_version }, 404);

    // Convert base64 (bytea) to Uint8Array
    const encBlob = toUint8(enc.encrypted_blob);
    const iv = toUint8(enc.iv);
    const keyRaw = toUint8(keyRec.key_hash);

    // Decrypt (AES-GCM)
    try {
      const decrypted = await decryptAesGcm(encBlob, iv, keyRaw);
      const base64 = b64encode(decrypted);
      const filename = `${sanitize(meta.phrase_text)}_${new Date(meta.created_at).toISOString().slice(0,10)}.${meta.audio_format || 'wav'}`;

      return json({ base64, filename, mimeType: 'audio/wav' }, 200);
    } catch (_e) {
      return json({ error: 'DECRYPTION_FAILED' }, 422);
    }
  } catch (e) {
    console.error('decrypt-download error:', e);
    return json({ error: e?.message || 'Internal server error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function sanitize(s: string): string {
  return (s || 'audio').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
}

function toUint8(input: string | Uint8Array): Uint8Array {
  if (input instanceof Uint8Array) return input;
  // PostgREST returns base64 for bytea
  try {
    return b64decode(input);
  } catch {
    // If not base64, try to interpret as binary string
    const arr = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) arr[i] = input.charCodeAt(i);
    return arr;
  }
}

async function decryptAesGcm(encrypted: Uint8Array, iv: Uint8Array, keyRaw: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', keyRaw, { name: 'AES-GCM' }, false, ['decrypt']);
  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
    return new Uint8Array(decrypted);
  } catch (e) {
    console.error('Decryption failed:', e);
    throw new Error('DECRYPTION_FAILED');
  }
}