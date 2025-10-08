import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { decodeBase64 as b64decode, encodeBase64 as b64encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parser robusto para audio_url que maneja múltiples formatos
function parseAudioUrl(audioUrl: string): { bucket: string; path: string } | null {
  if (!audioUrl) return null;
  
  console.log('Parsing audio_url:', audioUrl);
  
  try {
    // Remover query strings
    const cleanUrl = audioUrl.split('?')[0];
    
    // Patrón 1: /storage/v1/object/sign/{bucket}/{path}
    let match = cleanUrl.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+)/);
    if (match) {
      console.log('Matched sign pattern:', { bucket: match[1], path: match[2] });
      return { bucket: match[1], path: decodeURIComponent(match[2]) };
    }
    
    // Patrón 2: /storage/v1/object/authenticated/{bucket}/{path}
    match = cleanUrl.match(/\/storage\/v1\/object\/authenticated\/([^/]+)\/(.+)/);
    if (match) {
      console.log('Matched authenticated pattern:', { bucket: match[1], path: match[2] });
      return { bucket: match[1], path: decodeURIComponent(match[2]) };
    }
    
    // Patrón 3: /storage/v1/object/public/{bucket}/{path}
    match = cleanUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (match) {
      console.log('Matched public pattern:', { bucket: match[1], path: match[2] });
      return { bucket: match[1], path: decodeURIComponent(match[2]) };
    }
    
    // Patrón 4: Simplemente {bucket}/{path} después de cualquier prefijo
    match = cleanUrl.match(/\/([^/]+)\/(.+)/);
    if (match && (match[1] === 'audio_raw' || match[1] === 'audio_clean')) {
      console.log('Matched simple bucket/path pattern:', { bucket: match[1], path: match[2] });
      return { bucket: match[1], path: decodeURIComponent(match[2]) };
    }
    
    console.warn('Could not parse audio_url:', audioUrl);
    return null;
  } catch (error) {
    console.error('Error parsing audio_url:', error);
    return null;
  }
}

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
        // Parse audio_url usando el parser robusto
        const parsed = parseAudioUrl(legacyRec.audio_url);
        
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
          unencrypted_storage_bucket: parsed?.bucket || null,
          unencrypted_file_path: parsed?.path || null
        };
        isLegacyRecording = true;
        console.log('Found in recordings (legacy), parsed audio_url:', parsed);
        
        // Si no hay ruta sin cifrar, intenta encontrarla en audio_metadata por pseudónimo + frase
        if (!meta.unencrypted_file_path && legacyRec.session_pseudonym && legacyRec.phrase_text) {
          console.log('Trying to locate matching audio_metadata by pseudonym + phrase...');
          const { data: amMatch, error: amErr } = await supabase
            .from('audio_metadata')
            .select('unencrypted_storage_bucket, unencrypted_file_path, created_at, id')
            .eq('session_pseudonym', legacyRec.session_pseudonym)
            .eq('phrase_text', legacyRec.phrase_text)
            .order('created_at', { ascending: false })
            .maybeSingle();
          if (amErr) console.warn('Lookup audio_metadata by pair failed:', amErr);
          if (amMatch && amMatch.unencrypted_file_path) {
            meta.unencrypted_storage_bucket = amMatch.unencrypted_storage_bucket || 'audio_raw';
            meta.unencrypted_file_path = amMatch.unencrypted_file_path;
            console.log('Matched audio_metadata for legacy record:', amMatch.id);
          }
        }
        
        // Si aún no hay, intentar por pseudónimo únicamente (último registro)
        if (!meta.unencrypted_file_path && legacyRec.session_pseudonym) {
          console.log('Trying to locate audio_metadata by pseudonym only...');
          const { data: amPseudo, error: amPseudoErr } = await supabase
            .from('audio_metadata')
            .select('unencrypted_storage_bucket, unencrypted_file_path, created_at, id')
            .eq('session_pseudonym', legacyRec.session_pseudonym)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (amPseudoErr) console.warn('Lookup audio_metadata by pseudonym failed:', amPseudoErr);
          if (amPseudo && amPseudo.unencrypted_file_path) {
            meta.unencrypted_storage_bucket = amPseudo.unencrypted_storage_bucket || 'audio_raw';
            meta.unencrypted_file_path = amPseudo.unencrypted_file_path;
            console.log('Matched audio_metadata by pseudonym for legacy record:', amPseudo.id);
          }
        }
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
        console.warn('No unencrypted path in metadata; attempting legacy search by pseudonym...');
        if (meta.session_pseudonym) {
          const located = await findUnencryptedByPseudonym(supabase, meta.session_pseudonym);
          if (located) {
            meta.unencrypted_storage_bucket = located.bucket;
            meta.unencrypted_file_path = located.path;
          }
        }
      }
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
    
    const { data: enc, error: encErr } = await supabase
      .from('encrypted_audio_files')
      .select('*')
      .eq('metadata_id', recordingId)
      .maybeSingle();

    if (encErr) {
      console.error('Encrypted file query error:', encErr);
      // continue to fallback attempts below instead of immediate 404
    }
    if (!enc) {
      console.error('Encrypted file not found for metadata_id:', recordingId);
      
      // Intentar localizar versión sin cifrar por pseudónimo si no tenemos ruta
      if (!meta.unencrypted_file_path && meta.session_pseudonym) {
        const located = await findUnencryptedByPseudonym(supabase, meta.session_pseudonym);
        if (located) {
          meta.unencrypted_storage_bucket = located.bucket;
          meta.unencrypted_file_path = located.path;
        }
      }
      
      // Fallback automático: intentar descarga sin cifrar si está disponible
      if (meta.unencrypted_file_path) {
        console.log('No encrypted file found, automatically falling back to unencrypted download');
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(meta.unencrypted_storage_bucket || 'audio_raw')
            .download(meta.unencrypted_file_path);
          
          if (!downloadError && fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            const base64 = b64encode(new Uint8Array(arrayBuffer));
            const filename = `${sanitize(meta.phrase_text)}_${new Date(meta.created_at).toISOString().slice(0,10)}.${meta.audio_format || 'wav'}`;
            
            console.log('Auto-fallback to unencrypted download successful:', filename);
            return json({ 
              base64, 
              filename, 
              mimeType: 'audio/wav',
              isLegacyFallback: true,
              message: 'No había versión cifrada, se descargó la versión sin cifrar'
            }, 200);
          }
          
          console.error('Fallback download failed:', downloadError);
        } catch (fallbackError) {
          console.error('Fallback to unencrypted failed:', fallbackError);
        }
      }
      
      return json({ error: 'Encrypted file not found and no unencrypted fallback available' }, 404);
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

// Heurística: localizar archivo sin cifrar en storage por pseudónimo
async function findUnencryptedByPseudonym(supabase: any, pseudonym: string): Promise<{ bucket: string; path: string } | null> {
  const buckets = ['audio_raw', 'audio_clean'];
  const searches = [
    `training_audio_${pseudonym}_`,
    pseudonym
  ];
  for (const bucket of buckets) {
    for (const term of searches) {
      try {
        const { data: list, error } = await supabase.storage
          .from(bucket)
          .list('', { limit: 1000, offset: 0, search: term });
        if (error) {
          console.warn('Storage list error', { bucket, term, error });
          continue;
        }
        if (list && list.length > 0) {
          // Coger el más reciente por updated_at si existe, si no, el primero
          const sorted = [...list].sort((a: any, b: any) => {
            const da = new Date(a.updated_at || a.created_at || 0).getTime();
            const db = new Date(b.updated_at || b.created_at || 0).getTime();
            return db - da;
          });
          console.log('Found legacy unencrypted candidate', { bucket, name: sorted[0].name });
          return { bucket, path: sorted[0].name };
        }
      } catch (err) {
        console.warn('Error listing storage for legacy search', { bucket, term, err });
      }
    }
  }
  return null;
}