// Adagio transcription service (via RunPod serverless edge function)
export interface AdagioResult {
  text: string;
  ms: number;
}

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || '';
const ADAGIO_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/stt-runpod`;

export async function transcribeAdagio(file: File): Promise<AdagioResult> {
  if (!ADAGIO_URL || !SUPABASE_PROJECT_ID) {
    throw new Error('Configuración de Adagio no disponible');
  }

  const formData = new FormData();
  formData.append('file', file);

  const startTime = performance.now();

  try {
    const response = await fetch(ADAGIO_URL, {
      method: 'POST',
      body: formData,
    });

    const totalMs = performance.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      const errorData = safeParseJson(errorText);
      throw new Error(errorData?.error || errorData?.message || `HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data || typeof data.text !== 'string') {
      throw new Error('Respuesta inválida de Adagio');
    }

    return { text: data.text, ms: totalMs };
  } catch (error) {
    const totalMs = performance.now() - startTime;
    const err = error as Error;
    err.message = `${err.message} (${totalMs.toFixed(0)}ms)`;
    throw err;
  }
}

function safeParseJson(text: string): any {
  try { return JSON.parse(text); } catch { return null; }
}
