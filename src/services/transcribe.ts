// Transcription service for communicating with FastAPI backend

export interface HealthResponse {
  online: boolean;
  error?: string;
}

export interface TranscribeResponse {
  text: string;
}

export interface TranscribeError {
  code: string;
  message: string;
  details?: string;
}

const TRANSCRIBE_URL = import.meta.env.VITE_TRANSCRIBE_URL || '';
const HEALTH_URL = import.meta.env.VITE_HEALTH_URL || '';
const TIMEOUT_MS = (parseInt(import.meta.env.VITE_TRANSCRIBE_TIMEOUT) || 90) * 1000;

class TranscribeService {
  /**
   * Check if the transcription backend is online
   */
  async ping(): Promise<HealthResponse> {
    if (!HEALTH_URL) {
      return { online: false, error: 'URL de salud no configurada' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for health check
      
      const response = await fetch(HEALTH_URL, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return { online: true };
      } else {
        return { 
          online: false, 
          error: `Servidor respondió con estado ${response.status}` 
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { online: false, error: 'Tiempo de espera agotado' };
        }
        return { online: false, error: error.message };
      }
      return { online: false, error: 'Error desconocido' };
    }
  }

  /**
   * Upload and transcribe an audio file
   */
  async transcribeFile(file: File): Promise<TranscribeResponse> {
    if (!TRANSCRIBE_URL) {
      throw this.createError(
        'CONFIG_ERROR',
        'URL de transcripción no configurada',
        'Verifica que VITE_TRANSCRIBE_URL esté configurado'
      );
    }

    if (!file) {
      throw this.createError(
        'NO_FILE',
        'No se proporcionó ningún archivo',
        'Selecciona un archivo de audio para transcribir'
      );
    }

    // Validate file type
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm'];
    if (!allowedTypes.includes(file.type)) {
      throw this.createError(
        'INVALID_FORMAT',
        'Formato de archivo no soportado',
        'Solo se permiten archivos WAV, MP3 y WebM'
      );
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      throw this.createError(
        'FILE_TOO_LARGE',
        'Archivo demasiado grande',
        'El archivo debe ser menor a 20MB'
      );
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(TRANSCRIBE_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        
        if (response.status === 413) {
          throw this.createError(
            'FILE_TOO_LARGE',
            'Archivo demasiado grande para el servidor',
            'Reduce el tamaño del archivo e intenta de nuevo'
          );
        } else if (response.status === 415) {
          throw this.createError(
            'INVALID_FORMAT',
            'Formato de archivo no aceptado por el servidor',
            'Usa un archivo WAV o MP3'
          );
        } else if (response.status >= 500) {
          throw this.createError(
            'SERVER_ERROR',
            'Error del servidor',
            'El servidor está experimentando problemas. Inténtalo más tarde'
          );
        } else {
          throw this.createError(
            'HTTP_ERROR',
            `Error HTTP ${response.status}`,
            errorText || 'Error desconocido del servidor'
          );
        }
      }

      const result = await response.json();
      
      if (!result || typeof result.text !== 'string') {
        throw this.createError(
          'INVALID_RESPONSE',
          'Respuesta inválida del servidor',
          'El servidor no devolvió una transcripción válida'
        );
      }

      return { text: result.text };

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw this.createError(
            'TIMEOUT',
            'Tiempo de espera agotado',
            `La transcripción tardó más de ${TIMEOUT_MS / 1000} segundos`
          );
        }
        
        // If it's already our custom error, re-throw it
        if ('code' in error) {
          throw error;
        }
        
        // Network errors
        if (error.message.includes('fetch')) {
          throw this.createError(
            'NETWORK_ERROR',
            'Error de conexión',
            'Verifica tu conexión a internet e inténtalo de nuevo'
          );
        }
      }
      
      throw this.createError(
        'UNKNOWN_ERROR',
        'Error desconocido',
        error instanceof Error ? error.message : 'Error inesperado'
      );
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

// Export singleton instance
export const transcribeService = new TranscribeService();