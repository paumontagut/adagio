import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  sessionId: string;
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

    // Route: Export user data
    if (req.method === 'POST' && path === '/export') {
      return await handleDataExport(req, supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Export handler error:', error);
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

async function handleDataExport(req: Request, supabase: any) {
  const { sessionId }: ExportRequest = await req.json();
  
  console.log('Starting data export for session:', sessionId);

  try {
    // Get session pseudonym
    const { data: mappingData, error: mappingError } = await supabase
      .from('session_mapping')
      .select('session_pseudonym')
      .eq('encrypted_session_id', new TextEncoder().encode(sessionId))
      .single();

    if (mappingError) {
      console.error('Error finding session mapping:', mappingError);
      // Fallback: try to generate pseudonym for existing data
      const { data: pseudonymResult } = await supabase
        .rpc('generate_pseudonym', { original_session_id: sessionId });
      
      if (!pseudonymResult) {
        throw new Error('Session not found');
      }
    }

    const sessionPseudonym = mappingData?.session_pseudonym || pseudonymResult;

    // Collect all user data
    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        sessionId: sessionId,
        sessionPseudonym: sessionPseudonym,
        dataController: 'Adagio Speech Recognition System',
        legalBasis: 'GDPR Art. 20 - Right to data portability'
      },
      audioMetadata: [],
      encryptedFiles: [],
      consentLogs: [],
      sessionMappings: [],
      encryptionInfo: {}
    };

    // Get audio metadata
    const { data: metadataRecords, error: metadataError } = await supabase
      .from('audio_metadata')
      .select('*')
      .eq('session_pseudonym', sessionPseudonym);

    if (metadataError) {
      console.error('Error fetching metadata:', metadataError);
    } else {
      exportData.audioMetadata = metadataRecords || [];
    }

    // Get encrypted audio files
    if (exportData.audioMetadata.length > 0) {
      const metadataIds = exportData.audioMetadata.map(m => m.id);
      
      const { data: encryptedFiles, error: filesError } = await supabase
        .from('encrypted_audio_files')
        .select('*')
        .in('metadata_id', metadataIds);

      if (filesError) {
        console.error('Error fetching encrypted files:', filesError);
      } else {
        exportData.encryptedFiles = encryptedFiles || [];
      }
    }

    // Get participant consents
    const { data: consentRecords, error: consentError } = await supabase
      .from('participant_consents')
      .select('*')
      .eq('session_pseudonym', sessionPseudonym);

    if (consentError) {
      console.error('Error fetching consent logs:', consentError);
    } else {
      exportData.consentLogs = consentRecords || [];
    }

    // Get session mapping (for transparency)
    const { data: sessionMappingData, error: sessionMappingError } = await supabase
      .from('session_mapping')
      .select('session_pseudonym, created_at, last_accessed')
      .eq('session_pseudonym', sessionPseudonym);

    if (sessionMappingError) {
      console.error('Error fetching session mapping:', sessionMappingError);
    } else {
      exportData.sessionMappings = sessionMappingData || [];
    }

    // Get encryption key information
    const { data: keyInfo, error: keyError } = await supabase
      .from('encryption_keys')
      .select('version, created_at, expires_at, is_active')
      .order('version', { ascending: false });

    if (keyError) {
      console.error('Error fetching key info:', keyError);
    } else {
      exportData.encryptionInfo = {
        algorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2-SHA256',
        iterations: 100000,
        availableKeyVersions: keyInfo || []
      };
    }

    // Create export package
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // For a real implementation, you would create a ZIP file with:
    // 1. JSON metadata file
    // 2. Individual encrypted audio files
    // 3. Decryption instructions
    // 4. Legal documentation
    
    // Simplified response for demo
    const exportResponse = {
      success: true,
      recordCount: exportData.audioMetadata.length,
      fileCount: exportData.encryptedFiles.length,
      consentRecordsCount: exportData.consentLogs.length,
      exportSize: new Blob([jsonData]).size,
      downloadUrl: `data:application/json;base64,${btoa(jsonData)}`,
      exportData: exportData // For immediate download
    };

    // Log export activity
    console.log('Data export completed:', {
      sessionId,
      recordCount: exportResponse.recordCount,
      exportSize: exportResponse.exportSize
    });

    return new Response(
      JSON.stringify(exportResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in data export:', error);
    throw error;
  }
}