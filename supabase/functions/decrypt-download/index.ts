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
  downloadType?: 'encrypted' | 'unencrypted'; // New field for download type
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

    const { recordingId, sessionToken, downloadType = 'encrypted' }: DecryptRequest = await req.json();
    console.log('Request received:', { recordingId, downloadType, hasSessionToken: !!sessionToken });
    
    if (!recordingId || !sessionToken) {
      console.error('Missing required fields');
      return json({ error: 'recordingId and sessionToken are required' }, 400);
    }

    // 1) Validate session
    console.log('Validating admin session...');
    const { data: session, error: sessionErr } = await supabase
      .from('admin_sessions')
      .select('admin_user_id, expires_at')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionErr) {
      console.error('Session validation error:', sessionErr);
      return json({ error: sessionErr.message }, 401);
    }
    if (!session) {
      console.error('Invalid or expired session');
      return json({ error: 'Invalid or expired session' }, 401);
    }

    console.log('Session valid, checking admin user...');
    const { data: admin, error: adminErr } = await supabase
      .from('admin_users')
      .select('id, role, is_active, email')
      .eq('id', session.admin_user_id)
      .maybeSingle();

    if (adminErr) {
      console.error('Admin user query error:', adminErr);
      return json({ error: adminErr.message }, 401);
    }
    if (!admin || !admin.is_active || (admin.role !== 'admin' && admin.role !== 'analyst')) {
      console.error('Unauthorized admin:', { admin });
      return json({ error: 'Unauthorized' }, 401);
    }

    console.log('Admin authorized:', admin.email);

    // 2) Load metadata - try audio_metadata first, then recordings (legacy)
    console.log('Loading metadata for recording:', recordingId);
    let meta = null;
    let isLegacyRecording = false;
    
    // Try audio_metadata first
    const { data: audioMeta, error: audioMetaErr } = await supabase
      .from('audio_metadata')
      .select('*')
      .eq('id', recordingId)
      .maybeSingle();

    if (audioMeta) {
      meta = audioMeta;
      console.log('Found in audio_metadata');
    } else {
      // Try recordings table (legacy)
      console.log('Not found in audio_metadata, trying recordings table');
      const { data: legacyRec, error: legacyErr } = await supabase
        .from('recordings')
        .select('*')
        .eq('id', recordingId)
        .maybeSingle();
      
      if (legacyErr) {
        console.error('Error querying recordings:', legacyErr);
      }
      
      if (legacyRec) {
        // Convert legacy recording format to metadata format
        meta = {
          id: legacyRec.id,
          session_pseudonym: legacyRec.session_pseudonym,
          phrase_text: legacyRec.phrase_text,
          audio_format: legacyRec.format || 'wav',
          sample_rate: legacyRec.sample_rate,
          duration_ms: legacyRec.duration_ms,
          consent_train: legacyRec.consent_train,
          consent_store: legacyRec.consent_store,
          encryption_key_version: 1, // Legacy recordings use version 1
          created_at: legacyRec.created_at,
          unencrypted_storage_bucket: 'audio_raw',
          unencrypted_file_path: legacyRec.audio_url?.includes('audio_raw') ? legacyRec.audio_url.split('audio_raw/')[1] : null
        };
        isLegacyRecording = true;
        console.log('Found in recordings (legacy)');
      }
    }

    if (!meta) {
      console.error('Recording not found in any table:', recordingId);
      return json({ error: 'Recording not found' }, 404);
    }

    console.log('Metadata loaded:', { 
      id: meta.id, 
      format: meta.audio_format, 
      hasUnencrypted: !!meta.unencrypted_file_path,
      encryptionVersion: meta.encryption_key_version,
      isLegacy: isLegacyRecording
    });

    // 3) Handle unencrypted download
    if (downloadType === 'unencrypted') {
      console.log('Processing unencrypted download request');
      if (!meta.unencrypted_file_path) {
        console.error('No unencrypted file path available');
        return json({ error: 'Unencrypted file not available for this recording' }, 404);
      }
      
      try {
        console.log('Downloading from storage:', { 
          bucket: meta.unencrypted_storage_bucket || 'audio_raw',
          path: meta.unencrypted_file_path 
        });
        
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(meta.unencrypted_storage_bucket || 'audio_raw')
          .download(meta.unencrypted_file_path);
        
        if (downloadError) {
          console.error('Storage download error:', downloadError);
          throw downloadError;
        }
        
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = b64encode(new Uint8Array(arrayBuffer));
        const filename = `unencrypted_${sanitize(meta.phrase_text)}_${new Date(meta.created_at).toISOString().slice(0,10)}.${meta.audio_format || 'wav'}`;
        
        console.log('Unencrypted download successful:', filename);
        return json({ base64, filename, mimeType: 'audio/wav' }, 200);
      } catch (error) {
        console.error('Error downloading unencrypted file:', error);
        return json({ error: 'Failed to download unencrypted file', details: error.message }, 500);
      }
    }

    // 4) Handle encrypted download (default behavior)
    console.log('Processing encrypted download request');
    
    // For legacy recordings from 'recordings' table, they might not have encrypted files
    if (isLegacyRecording && meta.unencrypted_file_path) {
      console.log('Legacy recording detected, attempting unencrypted download');
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(meta.unencrypted_storage_bucket || 'audio_raw')
          .download(meta.unencrypted_file_path);
        
        if (!downloadError && fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          const base64 = b64encode(new Uint8Array(arrayBuffer));
          const filename = `legacy_${sanitize(meta.phrase_text)}_${new Date(meta.created_at).toISOString().slice(0,10)}.${meta.audio_format || 'wav'}`;
          
          console.log('Legacy unencrypted download successful');
          return json({ 
            base64, 
            filename, 
            mimeType: 'audio/wav',
            isLegacyFallback: true,
            message: 'Grabación legacy descargada correctamente'
          }, 200);
        }
      } catch (error) {
        console.error('Legacy download failed:', error);
      }
    }
    
    const { data: enc, error: encErr } = await supabase
      .from('encrypted_audio_files')
      .select('*')
      .eq('metadata_id', recordingId)
      .maybeSingle();

    if (encErr) {
      console.error('Encrypted file query error:', encErr);
      return json({ error: encErr.message }, 404);
    }
    if (!enc) {
      console.error('Encrypted file not found for metadata_id:', recordingId);
      
      // If no encrypted file, suggest trying unencrypted
      if (meta.unencrypted_file_path) {
        return json({ 
          error: 'No encrypted version available', 
          details: 'Esta grabación no tiene versión cifrada. Usa la descarga sin cifrar.',
          hasUnencrypted: true
        }, 404);
      }
      
      return json({ error: 'Encrypted file not found' }, 404);
    }

    console.log('Encrypted file found, blob size:', enc.encrypted_blob?.length || 0);

    // 5) Load key by version (may be inactive but must match recording version)
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
    const keyRaw = await decodeKeyMaterial(keyRec.key_hash);

    // Decrypt (AES-GCM) with fallback for legacy files
    try {
      const decrypted = await decryptAesGcm(encBlob, iv, keyRaw);
      const base64 = b64encode(decrypted);
      const filename = `encrypted_${sanitize(meta.phrase_text)}_${new Date(meta.created_at).toISOString().slice(0,10)}.${meta.audio_format || 'wav'}`;

      return json({ base64, filename, mimeType: 'audio/wav' }, 200);
    } catch (e) {
      console.error('Decryption failed:', e);
      const errorMsg = e?.message || '';
      
      // For legacy files, try to fallback to unencrypted version if available
      if ((errorMsg.includes('iv length') || errorMsg.includes('OperationError') || meta.encryption_key_version === 1)) {
        if (meta.unencrypted_file_path) {
          try {
            const { data: fileData, error: downloadError } = await supabase.storage
              .from(meta.unencrypted_storage_bucket || 'audio_raw')
              .download(meta.unencrypted_file_path);
            
            if (!downloadError && fileData) {
              const arrayBuffer = await fileData.arrayBuffer();
              const base64 = b64encode(new Uint8Array(arrayBuffer));
              const filename = `legacy_fallback_${sanitize(meta.phrase_text)}_${new Date(meta.created_at).toISOString().slice(0,10)}.${meta.audio_format || 'wav'}`;
              
              return json({ 
                base64, 
                filename, 
                mimeType: 'audio/wav',
                isLegacyFallback: true,
                message: 'Esta es una grabación legacy. Se descargó la versión sin cifrar.'
              }, 200);
            }
          } catch (fallbackError) {
            console.error('Fallback to unencrypted also failed:', fallbackError);
          }
        }
        
        return json({ 
          error: 'LEGACY_CLIENT_ENCRYPTED', 
          details: 'This recording was encrypted client-side and cannot be decrypted by the server',
          hasUnencrypted: !!meta.unencrypted_file_path
        }, 422);
      }
      
      return json({ error: 'DECRYPTION_FAILED', details: errorMsg }, 422);
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

function hexToUint8(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase().replace(/^0x/, '');
  if (clean.length % 2 !== 0) return new Uint8Array();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) out[i / 2] = parseInt(clean.substr(i, 2), 16);
  return out;
}

async function decodeKeyMaterial(key: string | Uint8Array): Promise<Uint8Array> {
  if (key instanceof Uint8Array) {
    if (key.byteLength === 16 || key.byteLength === 24 || key.byteLength === 32) return key;
    const hash = await crypto.subtle.digest('SHA-256', key);
    return new Uint8Array(hash);
  }
  const k = (key || '').trim();
  // base64 first
  try {
    const b = b64decode(k);
    if (b.byteLength === 16 || b.byteLength === 24 || b.byteLength === 32) return b;
  } catch {}
  // hex
  if (/^[0-9a-fA-F]+$/.test(k) || k.startsWith('0x')) {
    const b = hexToUint8(k);
    if (b.byteLength === 16 || b.byteLength === 24 || b.byteLength === 32) return b;
  }
  // fallback sha-256 of utf-8 string
  const enc = new TextEncoder().encode(k);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return new Uint8Array(hash);
}

async function decryptAesGcm(encrypted: Uint8Array, iv: Uint8Array, keyRaw: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', keyRaw, { name: 'AES-GCM' }, false, ['decrypt']);
  
  // Handle different IV lengths - AES-GCM typically uses 12 bytes, but some legacy might use 16
  let processedIv = iv;
  if (iv.length !== 12 && iv.length !== 16) {
    console.warn(`Unusual IV length: ${iv.length} bytes. Attempting to process...`);
    // If IV is too long, truncate to 12 bytes
    if (iv.length > 12) {
      processedIv = iv.slice(0, 12);
    } else {
      // If too short, pad with zeros (not ideal but fallback)
      const paddedIv = new Uint8Array(12);
      paddedIv.set(iv);
      processedIv = paddedIv;
    }
  }
  
  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: processedIv }, key, encrypted);
    return new Uint8Array(decrypted);
  } catch (e) {
    console.error('Decryption failed:', e);
    throw new Error(`DECRYPTION_FAILED: ${e.message}`);
  }
}