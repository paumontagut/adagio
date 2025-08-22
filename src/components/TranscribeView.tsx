import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder } from '@/components/AudioRecorder';
import { FileUpload } from '@/components/FileUpload';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { sessionManager } from '@/lib/sessionManager';
import { Loader2, Copy, Download, FileAudio } from 'lucide-react';

interface TranscriptionResponse {
  transcription: string;
}

export const TranscribeView = () => {
  const [transcription, setTranscription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Track page view analytics
  useEffect(() => {
    sessionManager.pageView('transcribe');
  }, []);

  const handleTranscribe = async () => {
    const fileToTranscribe = audioBlob || uploadedFile;
    
    if (!fileToTranscribe) {
      toast({
        title: "Error",
        description: "Por favor graba un audio o sube un archivo primero",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Track analytics
    sessionManager.transcribeRequest();
    
    try {
      const formData = new FormData();
      formData.append('audio_file', fileToTranscribe);
      formData.append('lang', 'es');

      const response = await fetch('/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('LARGE_FILE');
        }
        if (response.status === 415) {
          throw new Error('INVALID_FORMAT');
        }
        throw new Error(`HTTP_${response.status}`);
      }

      const data: TranscriptionResponse = await response.json();
      
      if (!data.transcription || data.transcription.trim() === '') {
        throw new Error('NO_AUDIO');
      }
      
      setTranscription(data.transcription);
      
      // Track success analytics
      const duration = audioBlob ? 5 : 0; // Would use actual duration
      sessionManager.transcribeSuccess(duration);
      
      toast({
        title: "Transcripción completada",
        description: "Audio transcrito correctamente",
      });
    } catch (error) {
      console.error('Error transcribing:', error);
      const errorMessage = error instanceof Error ? error.message : 'UNKNOWN';
      setError(errorMessage);
      
      // Track error analytics
      sessionManager.transcribeError(errorMessage);
      
      let toastMessage = "Error al procesar el audio";
      if (errorMessage === 'NO_AUDIO') {
        toastMessage = "No se detectó audio en el archivo";
      } else if (errorMessage === 'INVALID_FORMAT') {
        toastMessage = "Formato de audio no válido";
      } else if (errorMessage === 'LARGE_FILE') {
        toastMessage = "El archivo es demasiado grande";
      } else if (errorMessage.includes('NetworkError')) {
        toastMessage = "Error de conexión";
      }
      
      toast({
        title: "Error en la transcripción",
        description: toastMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTranscription = useCallback(() => {
    if (transcription) {
      navigator.clipboard.writeText(transcription);
      toast({
        title: "Copiado",
        description: "Transcripción copiada al portapapeles",
      });
    }
  }, [transcription, toast]);

  const handleDownloadTranscription = useCallback(() => {
    if (transcription) {
      const blob = new Blob([transcription], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transcripcion.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [transcription]);

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setUploadedFile(null);
    setError(null); // Clear any previous errors
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setAudioBlob(null);
    setError(null); // Clear any previous errors
  };

  const getErrorDetails = (errorCode: string) => {
    switch (errorCode) {
      case 'NO_AUDIO':
        return {
          title: 'No se detectó audio',
          description: 'El archivo no contiene audio audible o está dañado.',
          solution: 'Verifica que el micrófono funcione correctamente y graba de nuevo, o prueba con otro archivo de audio.'
        };
      case 'INVALID_FORMAT':
        return {
          title: 'Formato no compatible',
          description: 'El formato del archivo no es compatible con el sistema.',
          solution: 'Usa archivos WAV, MP3 o WEBM únicamente. Evita formatos poco comunes o archivos corruptos.'
        };
      case 'LARGE_FILE':
        return {
          title: 'Archivo muy grande',
          description: 'El archivo supera el límite de tamaño permitido.',
          solution: 'Reduce la duración del audio o usa una menor calidad de grabación. Máximo 20MB.'
        };
      default:
        if (errorCode.includes('NetworkError')) {
          return {
            title: 'Error de conexión',
            description: 'No se pudo conectar con el servidor de transcripción.',
            solution: 'Verifica tu conexión a internet e inténtalo de nuevo.'
          };
        }
        return {
          title: 'Error desconocido',
          description: 'Ocurrió un problema inesperado durante la transcripción.',
          solution: 'Inténtalo de nuevo en unos momentos o contacta con soporte.'
        };
    }
  };

  const hasAudio = audioBlob || uploadedFile;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Transcripción de Audio
        </h2>
        <p className="text-muted-foreground">
          Graba tu voz o sube un archivo para transcribir a texto
        </p>
      </div>

      {/* Audio Recording Section */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 text-foreground">Grabar Audio</h3>
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
      </Card>

      {/* File Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 text-foreground">Subir Archivo</h3>
        <FileUpload onFileSelect={handleFileUpload} />
      </Card>

      {/* Error State */}
      {error && (
        <ErrorState 
          {...getErrorDetails(error)}
          onRetry={() => setError(null)}
        />
      )}

      {/* Transcribe Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleTranscribe}
          disabled={!hasAudio || isLoading}
          size="xl"
          variant="default"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Transcribiendo...
            </>
          ) : (
            'Transcribir Audio'
          )}
        </Button>
      </div>

      {/* Empty State or Transcription Results */}
      {!transcription && !error && !isLoading && (
        <EmptyState
          icon={FileAudio}
          title="Listo para transcribir"
          description="Graba tu voz o sube un archivo para comenzar la transcripción automática"
        />
      )}

      {/* Transcription Results */}
      {transcription && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-foreground">Transcripción</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTranscription}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTranscription}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>
          </div>
          <Textarea
            value={transcription}
            readOnly
            className="min-h-[120px] resize-none"
            placeholder="La transcripción aparecerá aquí..."
          />
        </Card>
      )}
    </div>
  );
};