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
}

interface KeyRotationRequest {
  reason?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Route: Store encrypted audio
    if (req.method === 'POST' && path === '/store-audio') {
      return await handleStoreAudio(req, supabase);
    }

    // Route: Rotate encryption keys
    if (req.method === 'POST' && path === '/rotate-keys') {
      return await handleKeyRotation(req, supabase);
    }

    // Route: Get current key version
    if (req.method === 'GET' && path === '/key-version') {
      return await handleGetKeyVersion(supabase);
    }

    // Route: Get encrypted audio (for authorized access)
    if (req.method === 'GET' && path === '/get-audio') {
      return await handleGetAudio(req, supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleStoreAudio(req: Request, supabase: any) {
  const data: EncryptedAudioData = await req.json();
  
  console.log('Storing encrypted audio:', {
    sessionId: data.sessionId,
    phraseText: data.phraseText,
    consentTrain: data.consentTrain,
    consentStore: data.consentStore
  });

  // Generate pseudonym for session
  const { data: pseudonymResult, error: pseudonymError } = await supabase
    .rpc('generate_pseudonym', { original_session_id: data.sessionId });

  if (pseudonymError) {
    console.error('Error generating pseudonym:', pseudonymError);
    throw new Error('Failed to generate session pseudonym');
  }

  const sessionPseudonym = pseudonymResult;

  // Get current encryption key version
  const { data: keyData, error: keyError } = await supabase
    .from('encryption_keys')
    .select('version')
    .eq('is_active', true)
    .single();

  if (keyError) {
    console.error('Error getting key version:', keyError);
    throw new Error('Failed to get encryption key version');
  }

  const currentKeyVersion = keyData.version;

  // Store session mapping in encrypted form
  const mappingIv = crypto.getRandomValues(new Uint8Array(12));
  const mappingSalt = crypto.getRandomValues(new Uint8Array(16));
  
  // In production, encrypt the session_id with a master key
  const encryptedSessionId = new TextEncoder().encode(data.sessionId); // Simplified for demo

  const { error: mappingError } = await supabase
    .from('session_mapping')
    .upsert({
      session_pseudonym: sessionPseudonym,
      encrypted_session_id: encryptedSessionId,
      mapping_iv: mappingIv,
      mapping_salt: mappingSalt
    });

  if (mappingError) {
    console.error('Error storing session mapping:', mappingError);
    // Continue even if mapping fails for demo purposes
  }

  // Store metadata with pseudonym
  const { data: metadataResult, error: metadataError } = await supabase
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
      encryption_key_version: currentKeyVersion
    })
    .select()
    .single();

  if (metadataError) {
    console.error('Error storing metadata:', metadataError);
    throw new Error('Failed to store audio metadata');
  }

  // Store encrypted audio file separately
  const { error: fileError } = await supabase
    .from('encrypted_audio_files')
    .insert({
      metadata_id: metadataResult.id,
      encrypted_blob: data.encryptedBlob,
      iv: data.iv,
      salt: data.salt
    });

  if (fileError) {
    console.error('Error storing encrypted file:', fileError);
    throw new Error('Failed to store encrypted audio file');
  }

  // Record consent in consent_logs table
  const { error: consentError } = await supabase
    .from('consent_logs')
    .insert({
      session_id: data.sessionId,
      consent_train: data.consentTrain,
      consent_store: data.consentStore,
      ip_address: null,
      user_agent: req.headers.get('user-agent') || 'unknown'
    });

  if (consentError) {
    console.error('Error recording consent:', consentError);
    // Continue even if consent logging fails
  }

  console.log('Successfully stored encrypted audio with metadata ID:', metadataResult.id);

  return new Response(
    JSON.stringify({ 
      success: true,
      metadataId: metadataResult.id,
      sessionPseudonym: sessionPseudonym,
      keyVersion: currentKeyVersion
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleKeyRotation(req: Request, supabase: any) {
  const data: KeyRotationRequest = await req.json();
  
  console.log('Rotating encryption keys:', data);

  // Call the key rotation function
  const { data: rotationResult, error: rotationError } = await supabase
    .rpc('rotate_encryption_key');

  if (rotationError) {
    console.error('Error rotating keys:', rotationError);
    throw new Error('Failed to rotate encryption keys');
  }

  const newKeyVersion = rotationResult;
  
  console.log('Successfully rotated to key version:', newKeyVersion);

  return new Response(
    JSON.stringify({ 
      success: true,
      newKeyVersion: newKeyVersion,
      rotatedAt: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleGetKeyVersion(supabase: any) {
  const { data: keyData, error: keyError } = await supabase
    .from('encryption_keys')
    .select('version, created_at, expires_at')
    .eq('is_active', true)
    .single();

  if (keyError) {
    console.error('Error getting key version:', keyError);
    throw new Error('Failed to get current key version');
  }

  return new Response(
    JSON.stringify({ 
      currentKeyVersion: keyData.version,
      createdAt: keyData.created_at,
      expiresAt: keyData.expires_at
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleGetAudio(req: Request, supabase: any) {
  const url = new URL(req.url);
  const metadataId = url.searchParams.get('metadataId');
  
  if (!metadataId) {
    return new Response(
      JSON.stringify({ error: 'Missing metadataId parameter' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Get encrypted audio file
  const { data: audioData, error: audioError } = await supabase
    .from('encrypted_audio_files')
    .select(`
      *,
      audio_metadata (
        session_pseudonym,
        phrase_text,
        consent_store,
        encryption_key_version
      )
    `)
    .eq('metadata_id', metadataId)
    .single();

  if (audioError) {
    console.error('Error retrieving audio:', audioError);
    return new Response(
      JSON.stringify({ error: 'Audio file not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Check if user consented to storage
  if (!audioData.audio_metadata.consent_store) {
    return new Response(
      JSON.stringify({ error: 'Access denied - no storage consent' }),
      { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  return new Response(
    JSON.stringify({
      encryptedBlob: audioData.encrypted_blob,
      iv: audioData.iv,
      salt: audioData.salt,
      keyVersion: audioData.audio_metadata.encryption_key_version,
      phraseText: audioData.audio_metadata.phrase_text,
      sessionPseudonym: audioData.audio_metadata.session_pseudonym
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}