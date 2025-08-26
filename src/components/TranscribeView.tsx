import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { RecorderUploader } from '@/components/RecorderUploader';
import { BackendStatus } from '@/components/BackendStatus';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { sessionManager } from '@/lib/sessionManager';
import { transcribeService, type TranscribeError } from '@/services/transcribe';
import type { ConversionResult } from '@/lib/audioConverter';
import { 
  Loader2, 
  Copy, 
  Download, 
  FileAudio, 
  Upload, 
  Waves, 
  CheckCircle 
} from 'lucide-react';

type TranscribeState = 'idle' | 'uploading' | 'transcribing' | 'completed' | 'error';

export const TranscribeView = () => {
  const [transcription, setTranscription] = useState('');
  const [state, setState] = useState<TranscribeState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMetadata, setAudioMetadata] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<TranscribeError | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  // Track page view analytics
  useEffect(() => {
    sessionManager.pageView('transcribe');
  }, []);

  const handleAudioReady = useCallback((blob: Blob, metadata: ConversionResult) => {
    setAudioBlob(blob);
    setAudioMetadata(metadata);
    setError(null);
    setState('idle');
  }, []);

  const handleTranscribe = async () => {
    if (!audioBlob) {
      toast({
        title: "No hay audio",
        description: "Por favor graba audio o sube un archivo primero",
        variant: "destructive"
      });
      return;
    }

    if (!backendOnline) {
      toast({
        title: "Servidor desconectado",
        description: "El servidor de transcripción no está disponible",
        variant: "destructive"
      });
      return;
    }

    setState('uploading');
    setError(null);
    setUploadProgress(0);

    // Track analytics
    sessionManager.transcribeRequest();
    
    // Timers and flags for UI state transitions
    let progressIntervalId: number | null = null;
    let toTranscribingTimeoutId: number | null = null;
    let finished = false;
    
    try {
      // Create file from blob with appropriate name and type
      const fileName = audioMetadata?.format === 'wav' ? 'audio.wav' : 'audio.mp3';
      const fileType = audioMetadata?.format === 'wav' ? 'audio/wav' : 'audio/mp3';
      const audioFile = new File([audioBlob], fileName, { type: fileType });

      // Simulate upload progress for mejor UX
      progressIntervalId = window.setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 200);

      // Pasar a estado "transcribing" tras breve delay salvo que ya haya terminado
      toTranscribingTimeoutId = window.setTimeout(() => {
        if (!finished) {
          setState('transcribing');
          setUploadProgress(100);
        }
        if (progressIntervalId) clearInterval(progressIntervalId);
      }, 800);

      const result = await transcribeService.transcribeFile(audioFile);

      // Marcar como finalizado y limpiar timers
      finished = true;
      if (toTranscribingTimeoutId) clearTimeout(toTranscribingTimeoutId);
      if (progressIntervalId) clearInterval(progressIntervalId);
      setUploadProgress(100);

      setTranscription(result.text);
      setState('completed');

      // Track success analytics
      const duration = audioMetadata?.duration || 0;
      sessionManager.transcribeSuccess(duration);

      toast({
        title: "Transcripción completada",
        description: "El audio ha sido transcrito exitosamente"
      });

    } catch (error) {
      const transcribeError = error as TranscribeError;

      // Cleanup timers to avoid stale state updates
      if (toTranscribingTimeoutId) clearTimeout(toTranscribingTimeoutId);
      if (progressIntervalId) clearInterval(progressIntervalId);

      setError(transcribeError);
      setState('error');
      
      // Track error analytics
      sessionManager.transcribeError(transcribeError.code);
      
      toast({
        title: "Error de transcripción",
        description: transcribeError.message,
        variant: "destructive"
      });
    } finally {
      // Ensure timers are cleared
      if (toTranscribingTimeoutId) clearTimeout(toTranscribingTimeoutId);
      if (progressIntervalId) clearInterval(progressIntervalId);
      setUploadProgress(0);
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

  const handleRetry = () => {
    setError(null);
    setState('idle');
  };

  const handleReset = () => {
    setAudioBlob(null);
    setAudioMetadata(null);
    setTranscription('');
    setError(null);
    setState('idle');
    setUploadProgress(0);
  };

  const getStateConfig = () => {
    switch (state) {
      case 'uploading':
        return {
          icon: Upload,
          title: 'Subiendo audio...',
          description: 'Enviando archivo al servidor',
          showProgress: true
        };
      case 'transcribing':
        return {
          icon: Waves,
          title: 'Transcribiendo...',
          description: 'Procesando audio y generando transcripción',
          showProgress: false
        };
      case 'completed':
        return {
          icon: CheckCircle,
          title: 'Completado',
          description: 'Transcripción generada exitosamente',
          showProgress: false
        };
      default:
        return null;
    }
  };

  const stateConfig = getStateConfig();
  const isProcessing = state === 'uploading' || state === 'transcribing';
  const canTranscribe = audioBlob && backendOnline && !isProcessing;
  
  // Debug info - remove in production
  console.log('TranscribeView state:', { 
    audioBlob: !!audioBlob, 
    backendOnline, 
    isProcessing, 
    canTranscribe,
    state,
    transcription: !!transcription
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Transcripción de Audio
          </h2>
          <p className="text-muted-foreground">
            Graba tu voz o sube un archivo para transcribir a texto
          </p>
        </div>
        
        {/* Backend Status */}
        <BackendStatus 
          onStatusChange={setBackendOnline}
          autoRefresh={true}
        />
      </div>

      {/* Audio Input Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">
            Entrada de Audio
          </h3>
          <RecorderUploader
            onAudioReady={handleAudioReady}
            disabled={isProcessing}
            maxDuration={20}
          />
        </div>
      </Card>

      {/* Processing State */}
      {stateConfig && (
        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <stateConfig.icon className={`h-8 w-8 text-primary ${state === 'transcribing' ? 'animate-pulse' : ''}`} />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-lg">{stateConfig.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {stateConfig.description}
              </p>
            </div>
            {stateConfig.showProgress && (
              <div className="w-full max-w-md space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {uploadProgress}% completado
                </p>
              </div>
            )}
            {state === 'transcribing' && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Esto puede tomar algunos segundos...
                </span>
              </div>
            )}
            
            {/* Show transcription directly in the same widget when completed */}
            {state === 'completed' && transcription && (
              <div className="w-full space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyTranscription}
                      className="w-full sm:w-auto"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTranscription}
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                  
                  <Textarea
                    value={transcription}
                    readOnly
                    className="min-h-[120px] resize-none bg-muted/30 text-center"
                    placeholder="La transcripción aparecerá aquí..."
                  />
                  
                  {audioMetadata && (
                    <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground bg-muted/20 p-3 rounded-md gap-2">
                      <span className="text-center sm:text-left">
                        Procesado: {audioMetadata.format.toUpperCase()} • 
                        {audioMetadata.sampleRate}Hz • 
                        {audioMetadata.channels} canal{audioMetadata.channels !== 1 ? 'es' : ''}
                      </span>
                      <span>
                        Duración: {Math.round(audioMetadata.duration)}s
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                    >
                      Transcribir otro audio
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && state === 'error' && (
        <ErrorState 
          title={error.message}
          description={error.details || 'Error durante la transcripción'}
          solution="Verifica tu conexión y los datos del audio e inténtalo de nuevo."
          onRetry={handleRetry}
        />
      )}

      {/* Transcribe Button */}
      {!isProcessing && !transcription && audioBlob && (
        <div className="flex justify-center">
          <Button 
            onClick={handleTranscribe}
            disabled={!canTranscribe}
            size="xl"
            variant="default"
            className="min-w-[200px]"
          >
            <FileAudio className="mr-2 h-4 w-4" />
            Transcribir Audio
          </Button>
          {!backendOnline && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Esperando conexión al servidor...
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {!audioBlob && !transcription && !error && state === 'idle' && (
        <EmptyState
          icon={FileAudio}
          title="Listo para transcribir"
          description="Graba tu voz o sube un archivo para comenzar la transcripción automática"
        />
      )}
    </div>
  );
};