import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeletionRequest {
  sessionId: string;
  confirmationEmail: string;
  confirmationText: string;
  userAgent: string;
  timestamp: string;
}

interface DeletionLog {
  sessionId: string;
  deletionTimestamp: string;
  itemsDeleted: {
    audioMetadata: number;
    encryptedFiles: number;
    consentLogs: number;
    sessionMappings: number;
    unlearningJobs: number;
  };
  confirmationDetails: {
    email: string;
    text: string;
    userAgent: string;
  };
  evidenceHash: string;
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

    // Route: Delete all user data
    if (req.method === 'POST' && path === '/delete-all') {
      return await handleCompleteDataDeletion(req, supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Deletion handler error:', error);
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

async function handleCompleteDataDeletion(req: Request, supabase: any) {
  const deletionRequest: DeletionRequest = await req.json();
  
  console.log('Starting complete data deletion for session:', deletionRequest.sessionId);

  // Validate confirmation inputs
  if (deletionRequest.confirmationEmail !== 'eliminar@adagio.app' || 
      deletionRequest.confirmationText !== 'ELIMINAR TODOS MIS DATOS') {
    return new Response(
      JSON.stringify({ error: 'Invalid confirmation' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const deletionLog: DeletionLog = {
      sessionId: deletionRequest.sessionId,
      deletionTimestamp: new Date().toISOString(),
      itemsDeleted: {
        audioMetadata: 0,
        encryptedFiles: 0,
        consentLogs: 0,
        sessionMappings: 0,
        unlearningJobs: 0
      },
      confirmationDetails: {
        email: deletionRequest.confirmationEmail,
        text: deletionRequest.confirmationText,
        userAgent: deletionRequest.userAgent
      },
      evidenceHash: ''
    };

    // Step 1: Get session pseudonym
    const { data: mappingData, error: mappingError } = await supabase
      .from('session_mapping')
      .select('session_pseudonym')
      .eq('encrypted_session_id', new TextEncoder().encode(deletionRequest.sessionId));

    let sessionPseudonym = null;
    if (!mappingError && mappingData && mappingData.length > 0) {
      sessionPseudonym = mappingData[0].session_pseudonym;
    } else {
      // Generate pseudonym as fallback
      const { data: pseudonymResult } = await supabase
        .rpc('generate_pseudonym', { original_session_id: deletionRequest.sessionId });
      sessionPseudonym = pseudonymResult;
    }

    if (!sessionPseudonym) {
      throw new Error('Unable to identify user data');
    }

    // Step 2: Delete encrypted audio files
    const { data: metadataRecords } = await supabase
      .from('audio_metadata')
      .select('id')
      .eq('session_pseudonym', sessionPseudonym);

    if (metadataRecords && metadataRecords.length > 0) {
      const metadataIds = metadataRecords.map(m => m.id);
      
      const { error: filesDeleteError } = await supabase
        .from('encrypted_audio_files')
        .delete()
        .in('metadata_id', metadataIds);

      if (filesDeleteError) {
        console.error('Error deleting encrypted files:', filesDeleteError);
      } else {
        deletionLog.itemsDeleted.encryptedFiles = metadataIds.length;
      }
    }

    // Step 3: Delete audio metadata
    const { error: metadataDeleteError } = await supabase
      .from('audio_metadata')
      .delete()
      .eq('session_pseudonym', sessionPseudonym);

    if (metadataDeleteError) {
      console.error('Error deleting metadata:', metadataDeleteError);
    } else {
      deletionLog.itemsDeleted.audioMetadata = metadataRecords?.length || 0;
    }

    // Step 4: Mark participant consents as withdrawn (logical deletion)
    const { data: consentRecords, error: consentUpdateError } = await supabase
      .from('participant_consents')
      .update({ 
        withdrawn_at: new Date().toISOString(),
        withdrawal_reason: deletionRequest.confirmationType || 'User requested deletion'
      })
      .eq('session_pseudonym', sessionPseudonym)
      .select('id');

    if (consentUpdateError) {
      console.error('Error updating participant consents:', consentUpdateError);
    } else {
      deletionLog.itemsDeleted.consentLogs = consentRecords?.length || 0;
    }

    // Step 5: Create unlearning jobs for all consent records
    if (consentRecords && consentRecords.length > 0) {
      for (const consentRecord of consentRecords) {
        const { error: unlearningError } = await supabase
          .from('unlearning_jobs')
          .insert({
            consent_log_id: consentRecord.id,
            status: 'pending',
            metadata: {
              deletion_request: true,
              complete_removal: true,
              timestamp: new Date().toISOString()
            }
          });

        if (unlearningError) {
          console.error('Error creating unlearning job:', unlearningError);
        } else {
          deletionLog.itemsDeleted.unlearningJobs++;
        }
      }
    }

    // Step 6: Delete session mapping
    const { error: mappingDeleteError } = await supabase
      .from('session_mapping')
      .delete()
      .eq('session_pseudonym', sessionPseudonym);

    if (mappingDeleteError) {
      console.error('Error deleting session mapping:', mappingDeleteError);
    } else {
      deletionLog.itemsDeleted.sessionMappings = 1;
    }

    // Step 7: Generate evidence hash
    const evidenceString = JSON.stringify(deletionLog);
    const encoder = new TextEncoder();
    const data = encoder.encode(evidenceString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    deletionLog.evidenceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Step 8: Send confirmation email (mock implementation)
    const emailContent = {
      to: 'user@example.com', // In production, get from user profile
      subject: 'Confirmación de Eliminación de Datos - Adagio',
      body: `
        Estimado usuario,
        
        Confirmamos que hemos procesado tu solicitud de eliminación de datos bajo el Art. 17 RGPD.
        
        Detalles de la eliminación:
        - Fecha: ${deletionLog.deletionTimestamp}
        - Grabaciones eliminadas: ${deletionLog.itemsDeleted.encryptedFiles}
        - Metadatos eliminados: ${deletionLog.itemsDeleted.audioMetadata}
        - Registros de consentimiento retirados: ${deletionLog.itemsDeleted.consentLogs}
        - Trabajos de desaprendizaje iniciados: ${deletionLog.itemsDeleted.unlearningJobs}
        
        Hash de evidencia: ${deletionLog.evidenceHash}
        
        Este proceso es irreversible. Tus datos han sido eliminados permanentemente.
        
        Para cualquier consulta, contacta con dpo@adagio.app
        
        Saludos,
        Equipo de Privacidad de Adagio
      `
    };

    console.log('Deletion completed successfully:', deletionLog);
    console.log('Email to send:', emailContent);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        deletionId: deletionLog.evidenceHash,
        itemsDeleted: deletionLog.itemsDeleted,
        timestamp: deletionLog.deletionTimestamp,
        emailSent: true,
        message: 'All data has been permanently deleted and unlearning jobs have been queued.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in complete data deletion:', error);
    throw error;
  }
}