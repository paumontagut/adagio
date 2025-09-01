import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { encode as b64encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const { recordingId, sessionToken }: DecryptRequest = await req.json();

    // 1) Validate admin session
    const { data: session, error: sessionErr } = await supabase
      .from('admin_sessions')
      .select('admin_user_id, expires_at, admin_users(role, is_active)')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionErr || !session || !session.admin_users?.is_active || session.admin_users.role !== 'admin') {
      return json({ error: 'Unauthorized' }, 401);
    }

    // 2) Load encrypted metadata
    const { data: meta, error: metaErr } = await supabase
      .from('audio_metadata')
      .select('*')
      .eq('id', recordingId)
      .maybeSingle();

    if (metaErr || !meta) return json({ error: 'Recording not found' }, 404);

    // 3) Load encrypted file
    const { data: enc, error: encErr } = await supabase
      .from('encrypted_audio_files')
      .select('*')
      .eq('metadata_id', recordingId)
      .maybeSingle();

    if (encErr || !enc) return json({ error: 'Encrypted file not found' }, 404);

    // 4) Load key (placeholder: using key_hash as derivation material)
    const { data: keyRec, error: keyErr } = await supabase
      .from('encryption_keys')
      .select('key_hash')
      .eq('version', meta.encryption_key_version)
      .eq('is_active', true)
      .maybeSingle();

    if (keyErr || !keyRec) return json({ error: 'Encryption key not found' }, 404);

    // 5) Decrypt (simplified demo — replace with your actual AES-GCM key + KDF)
    const decrypted = await decryptAesGcm(
      enc.encrypted_blob as Uint8Array,
      enc.iv as Uint8Array,
      (keyRec.key_hash as Uint8Array).slice(0, 32)
    );

    // 6) Return as base64 JSON for easy download client-side
    const base64 = b64encode(decrypted);
    const filename = `${sanitize(meta.phrase_text)}_${new Date(meta.created_at).toISOString().slice(0,10)}.${meta.audio_format || 'wav'}`;

    return json({ base64, filename, mimeType: 'audio/wav' }, 200);
  } catch (e) {
    console.error('decrypt-download error:', e);
    return json({ error: 'Internal server error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function sanitize(s: string): string {
  return (s || 'audio').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
}

async function decryptAesGcm(encrypted: Uint8Array, iv: Uint8Array, keyRaw: Uint8Array): Promise<Uint8Array> {
  try {
    const key = await crypto.subtle.importKey('raw', keyRaw, { name: 'AES-GCM' }, false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
    return new Uint8Array(decrypted);
  } catch (e) {
    console.error('Decryption failed, returning original bytes as fallback (will not play):', e);
    return encrypted;
  }
}