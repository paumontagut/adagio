// Adagio transcription service for batch processing
export interface AdagioResult {
  text: string;
  ms: number;
}

export interface AdagioError {
  message: string;
  code: string;
}

export async function transcribeAdagio(file: File): Promise<AdagioResult> {
  const url = import.meta.env.VITE_ADAGIO_URL as string;
  
  if (!url) {
    throw new Error('VITE_ADAGIO_URL no está configurada');
  }

  const formData = new FormData();
  formData.append('file', file);

  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const endTime = performance.now();
    const totalMs = endTime - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      const errorData = safeParseJson(errorText);
      
      throw new Error(
        errorData?.detail || 
        errorData?.message || 
        `HTTP ${response.status}: ${errorText}`
      );
    }

    const responseText = await response.text();
    const data = safeParseJson(responseText);

    if (!data || typeof data.text !== 'string') {
      throw new Error('Respuesta inválida de Adagio: ' + responseText);
    }

    return {
      text: data.text,
      ms: totalMs
    };

  } catch (error) {
    const endTime = performance.now();
    const totalMs = endTime - startTime;

    // Re-throw with timing information
    const adagioError = error as Error;
    adagioError.message = `${adagioError.message} (${totalMs.toFixed(0)}ms)`;
    throw adagioError;
  }
}

function safeParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Health check for Adagio server
export async function checkAdagioHealth(): Promise<boolean> {
  const healthUrl = import.meta.env.VITE_HEALTH_URL as string;
  
  if (!healthUrl) {
    return false;
  }

  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}