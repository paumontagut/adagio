import { supabase } from "@/integrations/supabase/client";

export async function speakWithElevenLabs(text: string): Promise<HTMLAudioElement> {
  // Use Supabase client's invoke method for proper authentication
  const { data, error } = await supabase.functions.invoke('tts-elevenlabs', {
    body: { text },
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (error) {
    throw new Error(error.message || 'Error al generar audio');
  }

  // Handle binary data from the edge function
  const audioBlob = new Blob([data], { type: 'audio/mpeg' });
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