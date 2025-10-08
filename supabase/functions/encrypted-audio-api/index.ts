import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EncryptedAudioData {
  sessionId: string;
  phraseText: string;
  encryptedBlob: string; // Base64 encoded
  iv: string; // Base64 encoded
  salt: string; // Base64 encoded
  durationMs: number;
  sampleRate: number;
  audioFormat: string;
  deviceInfo: string;
  qualityScore?: number;
  consentTrain: boolean;
  consentStore: boolean;
  fullName: string;
}

denoServe: Deno.ServeHandler;

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    let body: any = null
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        body = await req.json()
      } catch (_) {
        body = null
      }
    }

    const url = new URL(req.url)
    const path = url.pathname
    const action = body?.action || url.searchParams.get('action') || ''

    console.log('encrypted-audio-api called', { method: req.method, path, action })

    if (req.method === 'POST' && action === 'get-key-version') {
      return await handleGetKeyVersion(supabase)
    }

    if (req.method === 'POST' && action === 'store-audio') {
      const { action: _a, ...clean } = body || {}
      const newReq = new Request(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify(clean)
      })
      return await handleStoreAudio(newReq, supabase)
    }

    if (req.method === 'POST' && action === 'store-audio-raw') {
      const { action: _a, ...clean } = body || {}
      const newReq = new Request(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify(clean)
      })
      return await handleStoreAudioRaw(newReq, supabase)
    }

    if ((req.method === 'GET' || req.method === 'POST') && (action === 'get-audio' || path.endsWith('/get-audio'))) {
      return await handleGetAudio(req, supabase)
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action', details: { method: req.method, path, action } }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('encrypted-audio-api error', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleStoreAudio(req: Request, supabase: any) {
  const data: EncryptedAudioData = await req.json()

  console.log('Storing encrypted audio (api)', {
    sessionId: data.sessionId,
    phraseText: data.phraseText,
    consentTrain: data.consentTrain,
    consentStore: data.consentStore
  })

  // Generate pseudonym
  const { data: pseudo, error: pseudoErr } = await supabase
    .rpc('generate_pseudonym', { original_session_id: data.sessionId })

  if (pseudoErr) {
    console.error('Pseudonym error', pseudoErr)
    return jsonError('Failed to generate session pseudonym', 500)
  }

  const sessionPseudonym = pseudo

  // Get active key version
  const { data: keyData, error: keyErr } = await supabase
    .from('encryption_keys')
    .select('version, key_hash')
    .eq('is_active', true)
    .single()

  if (keyErr) {
    console.error('Key version error', keyErr)
    return jsonError('Failed to get encryption key version', 500)
  }

  const currentKeyVersion = keyData.version

  // Upsert session mapping (demo encryption)
  const mappingIv = crypto.getRandomValues(new Uint8Array(12))
  const mappingSalt = crypto.getRandomValues(new Uint8Array(16))
  const encryptedSessionId = new TextEncoder().encode(data.sessionId)

  const { error: mapErr } = await supabase.from('session_mapping').upsert({
    session_pseudonym: sessionPseudonym,
    encrypted_session_id: encryptedSessionId,
    mapping_iv: mappingIv,
    mapping_salt: mappingSalt
  })
  if (mapErr) console.warn('Session mapping warning', mapErr)

  // IMPORTANTE: Descifrar el audio cifrado por el cliente para guardar versión sin cifrar
  let unencryptedFileName: string | null = null
  let unencryptedFileSize: number | null = null
  
  try {
    const encryptedBytes = base64ToUint8(data.encryptedBlob)
    const iv = base64ToUint8(data.iv)
    const keyBytes = await decodeKeyMaterial(keyData.key_hash)
    
    // Intentar descifrar
    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt'])
    let processedIv = iv
    if (iv.length !== 12 && iv.length !== 16) {
      if (iv.length > 12) processedIv = iv.slice(0, 12)
      else {
        const paddedIv = new Uint8Array(12)
        paddedIv.set(iv)
        processedIv = paddedIv
      }
    }
    const decryptedBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: processedIv }, cryptoKey, encryptedBytes)
    const decryptedBytes = new Uint8Array(decryptedBuf)
    
    // Guardar versión sin cifrar
    unencryptedFileName = `training_audio_${sessionPseudonym}_${Date.now()}.wav`
    const { error: unencryptedErr } = await supabase.storage
      .from('audio_raw')
      .upload(unencryptedFileName, decryptedBytes, {
        contentType: 'audio/wav',
        upsert: false
      })
    
    if (unencryptedErr) {
      console.error('Error storing unencrypted audio:', unencryptedErr)
      unencryptedFileName = null
    } else {
      unencryptedFileSize = decryptedBytes.byteLength
      console.log('Unencrypted version stored successfully:', unencryptedFileName)
    }
  } catch (decryptErr) {
    console.warn('Could not decrypt client-side encrypted audio for backup:', decryptErr)
    // Continue without unencrypted version
  }

  // Insert metadata
  const { data: meta, error: metaErr } = await supabase
    .from('audio_metadata')
    .insert({
      session_pseudonym: sessionPseudonym,
      phrase_text: data.phraseText,
      duration_ms: data.durationMs,
      sample_rate: data.sampleRate,
      audio_format: data.audioFormat,
      device_info: data.deviceInfo,
      quality_score: data.qualityScore,
      consent_train: data.consentTrain,
      consent_store: data.consentStore,
      encryption_key_version: currentKeyVersion,
      unencrypted_file_path: unencryptedFileName,
      unencrypted_storage_bucket: unencryptedFileName ? 'audio_raw' : null,
      unencrypted_file_size_bytes: unencryptedFileSize
    })
    .select()
    .single()

  if (metaErr) {
    console.error('Metadata error', metaErr)
    return jsonError('Failed to store audio metadata', 500)
  }

  // Insert encrypted payload
  const { error: fileErr } = await supabase.from('encrypted_audio_files').insert({
    metadata_id: meta.id,
    encrypted_blob: data.encryptedBlob,
    iv: data.iv,
    salt: data.salt
  })

  if (fileErr) {
    console.error('Encrypted file error', fileErr)
    return jsonError('Failed to store encrypted audio file', 500)
  }

  // Consent log
  const { error: consentErr } = await supabase.from('consent_logs').insert({
    session_id: data.sessionId,
    consent_train: data.consentTrain,
    consent_store: data.consentStore,
    full_name: data.fullName,
    user_agent: req.headers.get('user-agent') || 'unknown'
  })
  if (consentErr) console.warn('Consent log warning', consentErr)

  return new Response(
    JSON.stringify({ success: true, metadataId: meta.id, sessionPseudonym, keyVersion: currentKeyVersion }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// New: Server-side encryption of raw audio (platform-managed decryption)
async function handleStoreAudioRaw(req: Request, supabase: any) {
  const data = await req.json() as {
    sessionId: string;
    phraseText: string;
    rawBlob: string; // base64
    durationMs: number;
    sampleRate: number;
    audioFormat: string;
    deviceInfo: string;
    qualityScore?: number;
    consentTrain: boolean;
    consentStore: boolean;
    fullName: string;
  };

  if (!data?.rawBlob) return jsonError('Missing raw audio data', 400);

  // Generate pseudonym
  const { data: pseudo, error: pseudoErr } = await supabase
    .rpc('generate_pseudonym', { original_session_id: data.sessionId })

  if (pseudoErr) {
    console.error('Pseudonym error', pseudoErr)
    return jsonError('Failed to generate session pseudonym', 500)
  }
  const sessionPseudonym = pseudo

  // Get active key (use key_hash bytes directly as AES-256 key)
  const { data: keyRow, error: keyErr } = await supabase
    .from('encryption_keys')
    .select('version, key_hash')
    .eq('is_active', true)
    .single();

  if (keyErr || !keyRow) {
    console.error('Key read error', keyErr)
    return jsonError('Failed to get encryption key', 500)
  }

  const keyBytes = await decodeKeyMaterial(keyRow.key_hash);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16)); // kept for schema consistency

  // Decode raw audio
  const rawBytes = base64ToUint8(data.rawBlob);

  // Encrypt server-side
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
  const encryptedBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, rawBytes);
  const encryptedBytes = new Uint8Array(encryptedBuf);

  // Guardar versión sin cifrar primero
  const unencryptedFileName = `training_audio_${sessionPseudonym}_${Date.now()}.wav`;
  const { error: unencryptedErr } = await supabase.storage
    .from('audio_raw')
    .upload(unencryptedFileName, rawBytes, {
      contentType: 'audio/wav',
      upsert: false
    });

  if (unencryptedErr) {
    console.error('Error storing unencrypted audio:', unencryptedErr);
    return jsonError('Failed to store unencrypted audio backup', 500);
  }

  // Insert metadata with both file references
  const { data: meta, error: metaErr } = await supabase
    .from('audio_metadata')
    .insert({
      session_pseudonym: sessionPseudonym,
      phrase_text: data.phraseText,
      duration_ms: data.durationMs,
      sample_rate: data.sampleRate,
      audio_format: data.audioFormat,
      device_info: data.deviceInfo,
      quality_score: data.qualityScore,
      consent_train: data.consentTrain,
      consent_store: data.consentStore,
      encryption_key_version: keyRow.version,
      unencrypted_file_path: unencryptedFileName,
      unencrypted_storage_bucket: 'audio_raw',
      file_size_bytes: encryptedBytes.byteLength,
      unencrypted_file_size_bytes: rawBytes.byteLength
    })
    .select()
    .single();

  if (metaErr) {
    console.error('Metadata error', metaErr)
    return jsonError('Failed to store audio metadata', 500)
  }

  // Insert encrypted payload
  const { error: fileErr } = await supabase.from('encrypted_audio_files').insert({
    metadata_id: meta.id,
    encrypted_blob: uint8ToBase64(encryptedBytes),
    iv: uint8ToBase64(iv),
    salt: uint8ToBase64(salt)
  });

  if (fileErr) {
    console.error('Encrypted file error', fileErr)
    return jsonError('Failed to store encrypted audio file', 500)
  }

  console.log(`Both encrypted and unencrypted versions stored successfully. Unencrypted: ${unencryptedFileName}`);

  // Consent log
  const { error: consentErr } = await supabase.from('consent_logs').insert({
    session_id: data.sessionId,
    consent_train: data.consentTrain,
    consent_store: data.consentStore,
    full_name: data.fullName,
    user_agent: req.headers.get('user-agent') || 'unknown'
  })
  if (consentErr) console.warn('Consent log warning', consentErr)

  return new Response(
    JSON.stringify({ success: true, metadataId: meta.id, sessionPseudonym, keyVersion: keyRow.version }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function base64ToUint8(b64: string): Uint8Array {
  try {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch (_e) {
    // If already Uint8Array in some environments
    // @ts-ignore
    if (b64?.byteLength !== undefined && b64.constructor?.name === 'Uint8Array') return b64 as Uint8Array;
    return new Uint8Array();
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function hexToUint8(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase().replace(/^0x/, '');
  const len = clean.length;
  if (len % 2 !== 0) return new Uint8Array();
  const out = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) out[i / 2] = parseInt(clean.substr(i, 2), 16);
  return out;
}

async function decodeKeyMaterial(key: string | Uint8Array): Promise<Uint8Array> {
  // If already bytes
  if (key instanceof Uint8Array) {
    if (key.byteLength === 16 || key.byteLength === 24 || key.byteLength === 32) return key;
    // Normalize to 32 bytes via SHA-256
    const hash = await crypto.subtle.digest('SHA-256', key);
    return new Uint8Array(hash);
  }

  const k = (key || '').trim();

  // Try base64 first
  try {
    const b = base64ToUint8(k);
    if (b.byteLength === 16 || b.byteLength === 24 || b.byteLength === 32) return b;
  } catch {}

  // Try hex
  if (/^[0-9a-fA-F]+$/.test(k) || k.startsWith('0x')) {
    const b = hexToUint8(k);
    if (b.byteLength === 16 || b.byteLength === 24 || b.byteLength === 32) return b;
  }

  // Fallback: hash UTF-8 string to 32 bytes
  const enc = new TextEncoder().encode(k);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return new Uint8Array(hash);
}

async function handleGetKeyVersion(supabase: any) {
  const { data, error } = await supabase
    .from('encryption_keys')
    .select('version, created_at, expires_at')
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Key version read error', error)
    return jsonError('Failed to get current key version', 500)
  }

  return new Response(
    JSON.stringify({ currentKeyVersion: data.version, createdAt: data.created_at, expiresAt: data.expires_at }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGetAudio(req: Request, supabase: any) {
  const url = new URL(req.url)
  const metadataId = url.searchParams.get('metadataId')

  if (!metadataId) return jsonError('Missing metadataId parameter', 400)

  const { data, error } = await supabase
    .from('encrypted_audio_files')
    .select(`*, audio_metadata ( session_pseudonym, phrase_text, consent_store, encryption_key_version )`)
    .eq('metadata_id', metadataId)
    .maybeSingle()

  if (error || !data) return jsonError('Audio file not found', 404)

  if (!data.audio_metadata.consent_store) return jsonError('Access denied - no storage consent', 403)

  return new Response(
    JSON.stringify({
      encryptedBlob: data.encrypted_blob,
      iv: data.iv,
      salt: data.salt,
      keyVersion: data.audio_metadata.encryption_key_version,
      phraseText: data.audio_metadata.phrase_text,
      sessionPseudonym: data.audio_metadata.session_pseudonym
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
