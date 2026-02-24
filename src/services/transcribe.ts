// Transcription service supporting multiple providers (Adagio via RunPod + OpenAI)

export interface HealthResponse {
  online: boolean;
  error?: string;
}

export interface TranscribeResponse {
  text: string;
  provider?: string;
}

export interface TranscribeError {
  code: string;
  message: string;
  details?: string;
}

export type TranscribeProvider = 'adagio' | 'openai';

// Environment configuration
const ENV = import.meta.env as any;
const SUPABASE_PROJECT_ID = ENV.VITE_SUPABASE_PROJECT_ID || '';
const ADAGIO_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/stt-runpod`;
const OPENAI_URL = ENV.VITE_STT_OPENAI_URL || `https://cydqkoohhzesogvctvhy.functions.supabase.co/functions/v1/stt-openai`;
const TIMEOUT_MS = (parseInt(ENV.VITE_TRANSCRIBE_TIMEOUT || '90')) * 1000;

class TranscribeService {
  private currentProvider: TranscribeProvider = 'adagio';

  getProviderInfo() {
    return {
      provider: this.currentProvider,
      name: this.currentProvider === 'openai' ? 'ChatGPT 4o Transcribe' : 'Adagio',
      url: this.currentProvider === 'openai' ? OPENAI_URL : ADAGIO_URL,
    };
  }

  setProvider(provider: TranscribeProvider) {
    this.currentProvider = provider;
  }

  /** Adagio uses RunPod serverless — always considered online */
  async ping(): Promise<HealthResponse> {
    return { online: true };
  }

  async transcribeFile(file: File): Promise<TranscribeResponse> {
    const endpoint = this.currentProvider === 'openai' ? OPENAI_URL : ADAGIO_URL;
    const providerName = this.getProviderInfo().name;

    if (!endpoint) {
      throw this.createError('CONFIG_ERROR', `URL de transcripción no configurada para ${providerName}`);
    }

    if (!file) {
      throw this.createError('NO_FILE', 'No se proporcionó ningún archivo', 'Selecciona un archivo de audio para transcribir');
    }

    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm'];
    if (!allowedTypes.includes(file.type)) {
      throw this.createError('INVALID_FORMAT', 'Formato de archivo no soportado', 'Solo se permiten archivos WAV, MP3 y WebM');
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      throw this.createError('FILE_TOO_LARGE', 'Archivo demasiado grande', 'El archivo debe ser menor a 20MB');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if (response.status === 413) {
          throw this.createError('FILE_TOO_LARGE', 'Archivo demasiado grande para el servidor');
        } else if (response.status === 415) {
          throw this.createError('INVALID_FORMAT', 'Formato no aceptado por el servidor');
        } else if (response.status >= 500) {
          throw this.createError('SERVER_ERROR', 'Error del servidor', 'Inténtalo más tarde');
        } else {
          throw this.createError('HTTP_ERROR', `Error HTTP ${response.status}`, errorText || 'Error desconocido');
        }
      }

      const result = await response.json();

      if (!result || typeof result.text !== 'string') {
        throw this.createError('INVALID_RESPONSE', 'Respuesta inválida del servidor');
      }

      return { text: result.text, provider: providerName };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw this.createError('TIMEOUT', 'Tiempo de espera agotado', `La transcripción tardó más de ${TIMEOUT_MS / 1000}s`);
        }
        if ('code' in error) throw error;
        if (error.message.includes('fetch')) {
          throw this.createError('NETWORK_ERROR', 'Error de conexión', 'Verifica tu conexión a internet');
        }
      }
      throw this.createError('UNKNOWN_ERROR', 'Error desconocido', error instanceof Error ? error.message : 'Error inesperado');
    }
  }

  private createError(code: string, message: string, details?: string): TranscribeError {
    const error = new Error(message) as Error & TranscribeError;
    error.code = code;
    error.message = message;
    error.details = details;
    return error;
  }
}

export const transcribeService = new TranscribeService();
