-- Create storage bucket for raw audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio_raw', 'audio_raw', false, 52428800, ARRAY['audio/wav', 'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for audio_raw bucket
-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role can manage audio_raw files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'audio_raw')
WITH CHECK (bucket_id = 'audio_raw');

-- Allow authenticated users to read their own files (optional)
CREATE POLICY "Users can read audio_raw files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'audio_raw');