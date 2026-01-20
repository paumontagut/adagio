import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { encodeBase64 as b64encode } from 'https://deno.land/std@0.224.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BackfillRequest {
  sessionToken: string
  recordingIds?: string[]
  limit?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { sessionToken, recordingIds, limit = 50 } = (await req.json()) as BackfillRequest

    if (!sessionToken) {
      return json({ error: 'sessionToken is required' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    // Validate admin session
    console.log('Validating admin session for backfill...')
    const { data: session, error: sesErr } = await supabase
      .from('admin_sessions')
      .select('admin_user_id, expires_at')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (sesErr || !session) return json({ error: 'Invalid or expired admin session' }, 401)

    const { data: admin, error: admErr } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('id', session.admin_user_id)
      .maybeSingle()

    if (admErr || !admin || !admin.is_active || (admin.role !== 'admin' && admin.role !== 'analyst')) {
      return json({ error: 'Unauthorized' }, 403)
    }

    console.log(`Backfill requested by ${admin.email}`)

    // Select targets
    let targets: any[] = []
    if (recordingIds && recordingIds.length > 0) {
      const { data, error } = await supabase
        .from('audio_metadata')
        .select('id, session_pseudonym, phrase_text, audio_format, encryption_key_version, created_at')
        .in('id', recordingIds)
      if (error) return json({ error: error.message }, 400)
      targets = data || []
    } else {
      const { data, error } = await supabase
        .from('audio_metadata')
        .select('id, session_pseudonym, phrase_text, audio_format, encryption_key_version, created_at, unencrypted_file_path')
        .is('unencrypted_file_path', null)
        .order('created_at', { ascending: false })
        .limit(Math.min(200, Math.max(1, limit)))
      if (error) return json({ error: error.message }, 400)
      targets = data || []
    }

    const results: any[] = []
    let success = 0, skipped = 0, failed = 0

    for (const t of targets) {
      try {
        // Skip if already has unencrypted
        const { data: fresh, error: freshErr } = await supabase
          .from('audio_metadata')
          .select('unencrypted_file_path, unencrypted_storage_bucket')
          .eq('id', t.id)
          .maybeSingle()
        if (freshErr) throw freshErr
        if (fresh?.unencrypted_file_path) {
          skipped++
          results.push({ id: t.id, status: 'skipped', reason: 'already has unencrypted' })
          continue
        }

        // Get encrypted blob
        const { data: encRow, error: encErr } = await supabase
          .from('encrypted_audio_files')
          .select('encrypted_blob, iv')
          .eq('metadata_id', t.id)
          .maybeSingle()
        if (encErr || !encRow) {
          failed++
          results.push({ id: t.id, status: 'failed', error: encErr?.message || 'no encrypted file' })
          continue
        }

        // Get key
        const { data: keyRow, error: keyErr } = await supabase
          .from('encryption_keys')
          .select('key_hash')
          .eq('version', t.encryption_key_version)
          .maybeSingle()
        if (keyErr || !keyRow) {
          failed++
          results.push({ id: t.id, status: 'failed', error: keyErr?.message || 'key not found' })
          continue
        }

        // Convert types
        const encrypted = toUint8(encRow.encrypted_blob)
        const iv = toUint8(encRow.iv)
        const keyRaw = await decodeKeyMaterial(keyRow.key_hash)

        // Decrypt
        let decrypted: Uint8Array
        try {
          decrypted = await decryptAesGcm(encrypted, iv, keyRaw)
        } catch (e) {
          // Client-side legacy encryption not supported
          failed++
          results.push({ id: t.id, status: 'failed', error: 'LEGACY_CLIENT_ENCRYPTED' })
          continue
        }

        // Upload to storage
        const bucket = 'audio_raw'
        const filename = `backfill/${t.id}_${new Date(t.created_at).toISOString().slice(0,10)}.${t.audio_format || 'wav'}`
        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(filename, new Uint8Array(decrypted), { upsert: true, contentType: 'audio/wav' })
        if (upErr) {
          failed++
          results.push({ id: t.id, status: 'failed', error: upErr.message })
          continue
        }

        // Update metadata
        const { error: updErr } = await supabase
          .from('audio_metadata')
          .update({
            unencrypted_storage_bucket: bucket,
            unencrypted_file_path: filename,
            unencrypted_file_size_bytes: decrypted.byteLength,
          })
          .eq('id', t.id)
        if (updErr) {
          failed++
          results.push({ id: t.id, status: 'failed', error: updErr.message })
          continue
        }

        success++
        results.push({ id: t.id, status: 'success', filename })
      } catch (err: any) {
        failed++
        results.push({ id: t.id, status: 'failed', error: err?.message || 'unknown' })
      }
    }

    return json({ success, skipped, failed, total: results.length, results })
  } catch (e: any) {
    console.error('admin-backfill-unencrypted error:', e)
    return json({ error: e?.message || 'Internal server error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function toUint8(input: string | Uint8Array): Uint8Array {
  if (input instanceof Uint8Array) return input
  // PostgREST returns base64 for bytea
  try {
    const bin = atob(input)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  } catch (_) {
    const arr = new Uint8Array(input.length)
    for (let i = 0; i < input.length; i++) arr[i] = input.charCodeAt(i)
    return arr
  }
}

function hexToUint8(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase().replace(/^0x/, '')
  if (clean.length % 2 !== 0) return new Uint8Array()
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) out[i / 2] = parseInt(clean.substr(i, 2), 16)
  return out
}

async function decodeKeyMaterial(key: string | Uint8Array): Promise<Uint8Array> {
  if (key instanceof Uint8Array) {
    if (key.byteLength === 16 || key.byteLength === 24 || key.byteLength === 32) return key
    const hash = await crypto.subtle.digest('SHA-256', key.buffer as ArrayBuffer)
    return new Uint8Array(hash)
  }
  const k = (key || '').trim()
  // try base64
  try {
    const b = Uint8Array.from(atob(k), c => c.charCodeAt(0))
    if (b.byteLength === 16 || b.byteLength === 24 || b.byteLength === 32) return b
  } catch {}
  // try hex
  if (/^[0-9a-fA-F]+$/.test(k) || k.startsWith('0x')) {
    const b = hexToUint8(k)
    if (b.byteLength === 16 || b.byteLength === 24 || b.byteLength === 32) return b
  }
  const enc = new TextEncoder().encode(k)
  const hash = await crypto.subtle.digest('SHA-256', enc.buffer as ArrayBuffer)
  return new Uint8Array(hash)
}

async function decryptAesGcm(encrypted: Uint8Array, iv: Uint8Array, keyRaw: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', keyRaw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['decrypt'])
  let processedIv = iv
  if (iv.length !== 12 && iv.length !== 16) {
    if (iv.length > 12) processedIv = iv.slice(0, 12)
    else {
      const paddedIv = new Uint8Array(12)
      paddedIv.set(iv)
      processedIv = paddedIv
    }
  }
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: processedIv.buffer as ArrayBuffer }, key, encrypted.buffer as ArrayBuffer)
  return new Uint8Array(decrypted)
}
