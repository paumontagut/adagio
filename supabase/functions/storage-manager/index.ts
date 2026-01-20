import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StorageRequest {
  action: 'rotate-keys' | 'create-backup' | 'upload-encrypted' | 'cleanup-expired';
  bucketId?: string;
  backupName?: string;
  retentionYears?: number;
  sessionPseudonym?: string;
  encryptedData?: string;
  fileName?: string;
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

    // Route: Storage management operations
    if (req.method === 'POST' && path === '/manage') {
      return await handleStorageManagement(req, supabase);
    }

    // Route: Get storage statistics
    if (req.method === 'GET' && path === '/stats') {
      return await handleStorageStats(supabase);
    }

    // Route: Cleanup expired data
    if (req.method === 'POST' && path === '/cleanup') {
      return await cleanupExpiredData(supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Storage manager error:', error);
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

async function handleStorageManagement(req: Request, supabase: any) {
  const request: StorageRequest = await req.json();
  
  console.log('Storage management request:', request);

  switch (request.action) {
    case 'rotate-keys':
      return await rotateStorageKeys(request, supabase);
    
    case 'create-backup':
      return await createWormBackup(request, supabase);
    
    case 'upload-encrypted':
      return await uploadEncryptedFile(request, supabase);
    
    case 'cleanup-expired':
      return await cleanupExpiredData(supabase);
    
    default:
      return new Response(
        JSON.stringify({ error: 'Invalid action specified' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
  }
}

async function rotateStorageKeys(request: StorageRequest, supabase: any) {
  if (!request.bucketId) {
    throw new Error('Bucket ID is required for key rotation');
  }

  console.log('Rotating keys for bucket:', request.bucketId);

  // Call the stored procedure to rotate keys
  const { data: newVersion, error } = await supabase
    .rpc('rotate_storage_key', { target_bucket_id: request.bucketId });

  if (error) {
    console.error('Key rotation error:', error);
    throw new Error(`Key rotation failed: ${error.message}`);
  }

  // Log the rotation event
  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert({
      event_type: 'storage_key_rotated',
      details: {
        bucket_id: request.bucketId,
        new_key_version: newVersion,
        rotated_at: new Date().toISOString(),
        reason: 'Manual rotation via API'
      }
    });

  if (auditError) {
    console.error('Audit log error:', auditError);
  }

  return new Response(
    JSON.stringify({
      success: true,
      bucketId: request.bucketId,
      newKeyVersion: newVersion,
      rotatedAt: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function createWormBackup(request: StorageRequest, supabase: any) {
  if (!request.bucketId || !request.backupName) {
    throw new Error('Bucket ID and backup name are required');
  }

  console.log('Creating WORM backup:', request.backupName);

  // Call the stored procedure to create backup
  const { data: backupId, error } = await supabase
    .rpc('create_worm_backup', {
      source_bucket: request.bucketId,
      backup_name: request.backupName,
      retention_years: request.retentionYears || 7
    });

  if (error) {
    console.error('WORM backup error:', error);
    throw new Error(`WORM backup failed: ${error.message}`);
  }

  // In a real implementation, this would:
  // 1. Create a compressed archive of the bucket contents
  // 2. Upload to the worm_backup bucket
  // 3. Set immutable metadata
  // 4. Verify backup integrity

  console.log('WORM backup created:', backupId);

  return new Response(
    JSON.stringify({
      success: true,
      backupId: backupId,
      bucketId: request.bucketId,
      backupName: request.backupName,
      retentionYears: request.retentionYears || 7,
      createdAt: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function uploadEncryptedFile(request: StorageRequest, supabase: any) {
  if (!request.bucketId || !request.sessionPseudonym || !request.encryptedData || !request.fileName) {
    throw new Error('Missing required parameters for encrypted upload');
  }

  console.log('Uploading encrypted file to bucket:', request.bucketId);

  try {
    // Decode base64 encrypted data
    const encryptedBuffer = Uint8Array.from(atob(request.encryptedData), c => c.charCodeAt(0));
    
    // Create file path with session pseudonym folder structure
    const filePath = `${request.sessionPseudonym}/${request.fileName}`;
    
    // Upload to the specified bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(request.bucketId)
      .upload(filePath, encryptedBuffer, {
        contentType: 'application/octet-stream',
        upsert: false // Prevent overwriting
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Log the upload event
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        event_type: 'encrypted_file_uploaded',
        details: {
          bucket_id: request.bucketId,
          file_path: filePath,
          session_pseudonym: request.sessionPseudonym,
          uploaded_at: new Date().toISOString(),
          file_size: encryptedBuffer.length
        }
      });

    if (auditError) {
      console.error('Audit log error:', auditError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        bucketId: request.bucketId,
        filePath: filePath,
        uploadedAt: new Date().toISOString(),
        fileSize: encryptedBuffer.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Encrypted upload error:', error);
    throw error;
  }
}

async function cleanupExpiredData(supabase: any) {
  console.log('Starting cleanup of expired data');

  const cleanupResults = {
    expiredKeys: 0,
    expiredAudits: 0,
    expiredBackups: 0
  };

  try {
    // Cleanup expired storage keys (keep for audit trail, but mark as expired)
    const { data: expiredKeys, error: keyError } = await supabase
      .from('storage_keys')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true)
      .select('id');

    if (keyError) {
      console.error('Key cleanup error:', keyError);
    } else {
      cleanupResults.expiredKeys = expiredKeys?.length || 0;
    }

    // Cleanup very old audit logs (beyond retention period)
    const { data: expiredAudits, error: auditError } = await supabase
      .from('audit_logs')
      .delete()
      .lt('retention_until', new Date().toISOString())
      .select('id');

    if (auditError) {
      console.error('Audit cleanup error:', auditError);
    } else {
      cleanupResults.expiredAudits = expiredAudits?.length || 0;
    }

    console.log('Cleanup completed:', cleanupResults);

    return new Response(
      JSON.stringify({
        success: true,
        cleanupResults: cleanupResults,
        cleanedAt: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
}

async function handleStorageStats(supabase: any) {
  try {
    // Get bucket statistics
    const buckets = ['audio_raw', 'audio_clean', 'labels', 'worm_backup'];
    const stats: {
      buckets: Record<string, { fileCount: number; sizeBytes: number; lastModified: string }>;
      totalFiles: number;
      activeKeys: number;
      auditLogs: number;
      lastUpdate: string;
    } = {
      buckets: {},
      totalFiles: 0,
      activeKeys: 0,
      auditLogs: 0,
      lastUpdate: new Date().toISOString()
    };

    // Get active storage keys count
    const { data: activeKeys, error: keyError } = await supabase
      .from('storage_keys')
      .select('id')
      .eq('is_active', true);

    if (!keyError) {
      stats.activeKeys = activeKeys?.length || 0;
    }

    // Get audit logs count (last 30 days)
    const { data: recentAudits, error: auditError } = await supabase
      .from('audit_logs')
      .select('id')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!auditError) {
      stats.auditLogs = recentAudits?.length || 0;
    }

    // For each bucket, get file count (simplified - in production would query storage.objects)
    for (const bucket of buckets) {
      stats.buckets[bucket] = {
        fileCount: 0, // Would be populated by actual storage queries
        sizeBytes: 0,
        lastModified: new Date().toISOString()
      };
    }

    return new Response(
      JSON.stringify(stats),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Stats error:', error);
    throw error;
  }
}
