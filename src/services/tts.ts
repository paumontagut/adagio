import { supabase } from "@/integrations/supabase/client";

export async function speakWithElevenLabs(text: string): Promise<HTMLAudioElement> {
  // Get auth session for optional authorization header (function is public)
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`https://cydqkoohhzesogvctvhy.supabase.co/functions/v1/tts-elevenlabs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || 'Error al generar audio');
  }

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