import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { recordingIds } = await req.json()

    if (!recordingIds || !Array.isArray(recordingIds) || recordingIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Recording IDs are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Processing bulk download for ${recordingIds.length} recordings`)

    // Fetch recordings from both tables
    const [unencryptedResult, encryptedResult] = await Promise.all([
      supabase
        .from('recordings')
        .select('id, phrase_text, audio_url, duration_ms, format, created_at, consent_store, consent_train')
        .in('id', recordingIds),
      supabase
        .from('audio_metadata')
        .select('id, phrase_text, duration_ms, audio_format, created_at, consent_train, consent_store, session_pseudonym')
        .in('id', recordingIds)
    ])

    if (unencryptedResult.error) {
      console.error('Error fetching unencrypted recordings:', unencryptedResult.error)
    }
    if (encryptedResult.error) {
      console.error('Error fetching encrypted recordings:', encryptedResult.error)
    }

    const unencryptedRecordings = unencryptedResult.data || []
    const encryptedRecordings = encryptedResult.data || []

    console.log(`Found ${unencryptedRecordings.length} unencrypted and ${encryptedRecordings.length} encrypted recordings`)

    // Create ZIP file with recordings and metadata
    const zipEntries: Array<{ name: string; data: Uint8Array }> = []

    // Add CSV metadata file
    const csvHeaders = 'ID,Fecha,Texto,Duracion_ms,Formato,Consentimiento_Almacen,Consentimiento_Entreno,Tipo,Sesion\n'
    let csvContent = csvHeaders

    // Process unencrypted recordings
    for (const recording of unencryptedRecordings) {
      csvContent += `${recording.id},${recording.created_at},${(recording.phrase_text || '').replace(/,/g, ';')},${recording.duration_ms || 0},${recording.format || 'unknown'},${recording.consent_store || false},${recording.consent_train || false},no_cifrado,${recording.user_id || 'guest'}\n`
      
      // Download audio file if available
      if (recording.audio_url) {
        try {
          const { data: audioData, error: downloadError } = await supabase.storage
            .from('audio_raw')
            .download(recording.audio_url.replace('/storage/v1/object/public/audio_raw/', ''))
          
          if (!downloadError && audioData) {
            const audioBuffer = await audioData.arrayBuffer()
            const fileName = `${recording.id}_${recording.phrase_text?.substring(0, 20) || 'audio'}.${recording.format || 'webm'}`
            zipEntries.push({
              name: `audio/${fileName}`,
              data: new Uint8Array(audioBuffer)
            })
          }
        } catch (error) {
          console.error(`Error downloading audio for recording ${recording.id}:`, error)
        }
      }
    }

    // Process encrypted recordings
    for (const recording of encryptedRecordings) {
      csvContent += `${recording.id},${recording.created_at},${(recording.phrase_text || '').replace(/,/g, ';')},${recording.duration_ms || 0},${recording.audio_format || 'wav'},${recording.consent_store || false},${recording.consent_train || false},cifrado,${recording.session_pseudonym || 'unknown'}\n`
      
      // For encrypted recordings, we'd need to decrypt them first
      // This is a placeholder - in production you'd implement decryption logic
      console.log(`Encrypted recording ${recording.id} requires decryption (not implemented in this demo)`)
    }

    // Add CSV to ZIP
    zipEntries.push({
      name: 'metadata.csv',
      data: new TextEncoder().encode(csvContent)
    })

    // Create a simple ZIP-like response (for demo purposes)
    // In production, you'd use a proper ZIP library
    if (zipEntries.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No audio files found for the selected recordings' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // For now, return download URLs for individual files
    // In a full implementation, you'd create a proper ZIP file
    const downloadInfo = {
      recordingsCount: unencryptedRecordings.length + encryptedRecordings.length,
      unencryptedCount: unencryptedRecordings.length,
      encryptedCount: encryptedRecordings.length,
      csvData: csvContent,
      message: 'Download information prepared. In production, this would return a ZIP file.',
      files: zipEntries.map(entry => entry.name)
    }

    console.log('Bulk download prepared successfully')

    return new Response(
      JSON.stringify(downloadInfo),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Bulk download error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})