import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DecryptRequest {
  recordingId: string;
  sessionToken: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const { recordingId, sessionToken }: DecryptRequest = await req.json();

    // Validate admin session
    const { data: sessionData } = await supabase
      .from('admin_sessions')
      .select('admin_user_id, admin_users(*)')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!sessionData) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get encrypted recording metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('audio_metadata')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (metadataError || !metadata) {
      return new Response(
        JSON.stringify({ error: 'Recording not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the encrypted file
    const { data: encryptedFile, error: fileError } = await supabase
      .from('encrypted_audio_files')
      .select('*')
      .eq('metadata_id', recordingId)
      .single();

    if (fileError || !encryptedFile) {
      return new Response(
        JSON.stringify({ error: 'Encrypted file not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get encryption key
    const { data: keyData, error: keyError } = await supabase
      .from('encryption_keys')
      .select('key_hash')
      .eq('version', metadata.encryption_key_version)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: 'Encryption key not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt the audio file (simplified decryption - in production you'd use proper crypto)
    // This is a placeholder - actual decryption would depend on your encryption implementation
    const decryptedData = await decryptAudioFile(
      encryptedFile.encrypted_blob,
      encryptedFile.salt,
      encryptedFile.iv,
      keyData.key_hash
    );

    // Generate filename
    const dateStr = new Date(metadata.created_at).toISOString().split('T')[0];
    const phraseStr = metadata.phrase_text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const filename = `${phraseStr}_${dateStr}.${metadata.audio_format}`;

    // Return the decrypted file
    return new Response(decryptedData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/wav',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': decryptedData.length.toString(),
      },
    });

  } catch (error) {
    console.error('Decryption error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simplified decryption function - replace with your actual decryption logic
async function decryptAudioFile(
  encryptedBlob: Uint8Array,
  salt: Uint8Array,
  iv: Uint8Array,
  keyHash: Uint8Array
): Promise<Uint8Array> {
  // This is a placeholder implementation
  // In a real scenario, you would:
  // 1. Derive the encryption key from keyHash and salt
  // 2. Use WebCrypto API to decrypt the blob with the key and IV
  // 3. Return the decrypted audio data
  
  try {
    // For now, we'll simulate decryption by returning the encrypted blob
    // Replace this with actual AES-GCM decryption
    const key = await crypto.subtle.importKey(
      'raw',
      keyHash.slice(0, 32), // Use first 32 bytes as key
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedBlob
    );

    return new Uint8Array(decrypted);
  } catch (error) {
    console.error('Actual decryption failed, returning placeholder:', error);
    // Fallback: return the encrypted blob (this won't play correctly but allows download)
    return encryptedBlob;
  }
}