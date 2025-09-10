import { supabase } from "@/integrations/supabase/client";

export async function speakWithElevenLabs(text: string): Promise<HTMLAudioElement> {
  // Get auth session for authorization header
  const { data: { session } } = await supabase.auth.getSession();
  
  // Directly fetch the Edge Function endpoint
  const response = await fetch(`https://cydqkoohhzesogvctvhy.supabase.co/functions/v1/tts-elevenlabs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZHFrb29oaHplc29ndmN0dmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDE2NzEsImV4cCI6MjA3MTc3NzY3MX0.UP09-Y6AqFsmVQLAx6qkRqNjqXNG4FFt7dgYvuIFzN8'
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al generar audio');
  }

  // Get the audio as ArrayBuffer
  const audioBuffer = await response.arrayBuffer();
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(audioBlob);
  
  const audio = new Audio(audioUrl);
  
  // Clean up the URL when audio ends
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
  };
  
  // Also clean up if there's an error
  audio.onerror = () => {
    URL.revokeObjectURL(audioUrl);
  };
  
  return audio;
}