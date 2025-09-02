-- Add admin access policies for audio_raw bucket
CREATE POLICY "Admins can access audio_raw files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio_raw' AND
  EXISTS (
    SELECT 1 FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid() 
    AND s.expires_at > now() 
    AND u.role IN ('admin', 'analyst')
  )
);

-- Allow admin downloads from audio_raw
CREATE POLICY "Admins can download audio_raw files"  
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio_raw' AND
  EXISTS (
    SELECT 1 FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.admin_user_id = auth.uid() 
    AND s.expires_at > now() 
    AND u.role IN ('admin', 'analyst')
  )
);