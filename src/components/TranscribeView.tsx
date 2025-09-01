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
import { supabase } from '@/integrations/supabase/client';

type TranscribeState = 'idle' | 'uploading' | 'transcribing' | 'completed' | 'error';

export const TranscribeView = () => {
  const [transcriptionAdagio, setTranscriptionAdagio] = useState('');
  const [transcriptionOpenAI, setTranscriptionOpenAI] = useState('');
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
    setTranscriptionAdagio('');
    setTranscriptionOpenAI('');

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

      // Convert audio to base64 for OpenAI API
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);

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

      // Call both APIs in parallel
      const [adagioResult, openAIResult] = await Promise.allSettled([
        transcribeService.transcribeFile(audioFile),
        supabase.functions.invoke('openai-transcribe', {
          body: { audio: base64Audio }
        })
      ]);

      // Marcar como finalizado y limpiar timers
      finished = true;
      if (toTranscribingTimeoutId) clearTimeout(toTranscribingTimeoutId);
      if (progressIntervalId) clearInterval(progressIntervalId);
      setUploadProgress(100);

      // Handle Adagio result
      if (adagioResult.status === 'fulfilled') {
        setTranscriptionAdagio(adagioResult.value.text);
      } else {
        console.error('Adagio transcription failed:', adagioResult.reason);
        setTranscriptionAdagio('Error: No se pudo transcribir con Adagio');
      }

      // Handle OpenAI result
      if (openAIResult.status === 'fulfilled' && openAIResult.value.data) {
        setTranscriptionOpenAI(openAIResult.value.data.text);
      } else {
        if (openAIResult.status === 'rejected') {
          console.error('OpenAI transcription failed:', openAIResult.reason);
          setTranscriptionOpenAI('Error: No se pudo transcribir con OpenAI');
        } else if (openAIResult.value.error) {
          // Handle specific error types from the edge function
          const errorData = openAIResult.value.data;
          if (errorData?.error === 'INSUFFICIENT_QUOTA') {
            setTranscriptionOpenAI('Error: Cuota de OpenAI agotada o sin facturación');
          } else {
            setTranscriptionOpenAI('Error: No se pudo transcribir con OpenAI');
          }
        } else {
          console.error('OpenAI transcription failed: Invalid response format');
          setTranscriptionOpenAI('Error: Respuesta inválida de OpenAI');
        }
      }

      setState('completed');

      // Track success analytics - only if at least one transcription succeeded
      const hasValidTranscription = (transcriptionAdagio && !transcriptionAdagio.includes('Error:')) || 
                                  (transcriptionOpenAI && !transcriptionOpenAI.includes('Error:'));
      
      if (hasValidTranscription) {
        const duration = audioMetadata?.duration || 0;
        sessionManager.transcribeSuccess(duration);
        
        toast({
          title: "Transcripción completada",
          description: "Audio transcrito con ambos servicios"
        });
      } else {
        sessionManager.transcribeError('Both services failed');
        
        toast({
          title: "Error de transcripción",
          description: "Ambos servicios fallaron en la transcripción",
          variant: "destructive"
        });
      }

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

  const handleCopyTranscription = useCallback((text: string, service: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: `Transcripción de ${service} copiada al portapapeles`,
      });
    }
  }, [toast]);

  const handleDownloadTranscription = useCallback((text: string, service: string) => {
    if (text) {
      const content = `Transcripción - ${service}\n\n${text}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcripcion_${service.toLowerCase().replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleRetry = () => {
    setError(null);
    setState('idle');
  };

  const handleReset = () => {
    setAudioBlob(null);
    setAudioMetadata(null);
    setTranscriptionAdagio('');
    setTranscriptionOpenAI('');
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
  const hasResults = transcriptionAdagio || transcriptionOpenAI;
  
  // Debug info - remove in production
  console.log('TranscribeView state:', { 
    audioBlob: !!audioBlob, 
    backendOnline, 
    isProcessing, 
    canTranscribe,
    state,
    hasResults
  });

  return (
    <div className="space-y-6" role="main" aria-labelledby="transcribe-heading">
      {/* Skip link for screen readers */}
      <a href="#transcribe-controls" className="skip-link">
        Saltar a controles de transcripción
      </a>

      {/* Accessibility status announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {state === 'uploading' && 'Subiendo archivo de audio al servidor'}
        {state === 'transcribing' && 'Transcribiendo audio, por favor espere'}
        {state === 'completed' && 'Transcripción completada exitosamente'}
        {state === 'error' && `Error en la transcripción: ${error?.message}`}
      </div>

      {/* Header */}
      <div className="text-center space-y-4">
        <div>
          <h2 id="transcribe-heading" className="text-2xl font-semibold text-foreground mb-2">
            Transcripción de Audio
          </h2>
          <p className="text-muted-foreground" id="transcribe-description">
            Graba tu voz o sube un archivo para transcribir a texto
          </p>
        </div>
      </div>

      {/* Audio Input Section */}
      <Card className="p-6" role="region" aria-labelledby="audio-input-heading">
        <div className="space-y-4">
          <h3 id="audio-input-heading" className="text-lg font-medium text-foreground">
            Entrada de Audio
          </h3>
          <RecorderUploader
            onAudioReady={handleAudioReady}
            disabled={isProcessing}
            maxDuration={20}
            aria-describedby="transcribe-description"
          />
        </div>
      </Card>

      {/* Processing State */}
      {stateConfig && (
        <Card className="p-6" role="region" aria-labelledby="processing-heading">
          <div className="flex flex-col items-center space-y-4">
            <div 
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              role="img"
              aria-label={`Estado: ${stateConfig.title}`}
            >
              <stateConfig.icon 
                className={`h-8 w-8 text-primary ${state === 'transcribing' ? 'animate-pulse' : ''}`}
                aria-hidden="true"
              />
            </div>
            <div className="text-center">
              <h3 id="processing-heading" className="font-medium text-lg">
                {stateConfig.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1" role="status">
                {stateConfig.description}
              </p>
            </div>
            {stateConfig.showProgress && (
              <div className="w-full max-w-md space-y-2" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
                <Progress 
                  value={uploadProgress} 
                  className="h-2"
                  aria-label={`Progreso de subida: ${uploadProgress}%`}
                />
                <p className="text-xs text-muted-foreground text-center" aria-live="polite">
                  {uploadProgress}% completado
                </p>
              </div>
            )}
            {state === 'transcribing' && (
              <div className="flex items-center space-x-2" role="status" aria-live="polite">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  Esto puede tomar algunos segundos...
                </span>
              </div>
            )}
            
            {/* Show comparison results when completed */}
            {state === 'completed' && hasResults && (
              <div className="w-full space-y-6 mt-6" role="region" aria-labelledby="transcription-results">
                <h4 id="transcription-results" className="text-lg font-semibold text-center">
                  Comparativa de Transcripciones
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Adagio Results */}
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-primary">Adagio</h5>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyTranscription(transcriptionAdagio, 'Adagio')}
                            disabled={!transcriptionAdagio || transcriptionAdagio.includes('Error:')}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadTranscription(transcriptionAdagio, 'Adagio')}
                            disabled={!transcriptionAdagio || transcriptionAdagio.includes('Error:')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                      
                      <Textarea
                        value={transcriptionAdagio || 'Transcribiendo...'}
                        readOnly
                        className={`min-h-[120px] resize-none text-sm ${
                          transcriptionAdagio?.includes('Error:') 
                            ? 'bg-destructive/10 text-destructive' 
                            : 'bg-muted/30'
                        }`}
                        placeholder="Transcripción de Adagio aparecerá aquí..."
                        aria-label="Transcripción de Adagio"
                      />
                    </div>
                  </Card>

                  {/* OpenAI Results */}
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-primary">ChatGPT 4o transcribe</h5>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyTranscription(transcriptionOpenAI, 'ChatGPT 4o')}
                            disabled={!transcriptionOpenAI || transcriptionOpenAI.includes('Error:')}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadTranscription(transcriptionOpenAI, 'ChatGPT 4o')}
                            disabled={!transcriptionOpenAI || transcriptionOpenAI.includes('Error:')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                      
                      <Textarea
                        value={transcriptionOpenAI || 'Transcribiendo...'}
                        readOnly
                        className={`min-h-[120px] resize-none text-sm ${
                          transcriptionOpenAI?.includes('Error:') 
                            ? 'bg-destructive/10 text-destructive' 
                            : 'bg-muted/30'
                        }`}
                        placeholder="Transcripción de ChatGPT 4o aparecerá aquí..."
                        aria-label="Transcripción de ChatGPT 4o"
                      />
                    </div>
                  </Card>
                </div>
                
                {audioMetadata && (
                  <div 
                    className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground bg-muted/20 p-3 rounded-md gap-2"
                    role="complementary"
                    aria-label="Información del archivo de audio"
                  >
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
                    aria-describedby="reset-description"
                  >
                    Transcribir otro audio
                  </Button>
                  <div id="reset-description" className="sr-only">
                    Limpiar el audio actual y comenzar una nueva transcripción
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
      {!isProcessing && !hasResults && audioBlob && (
        <div className="flex flex-col items-center space-y-4" id="transcribe-controls">
          <Button 
            onClick={handleTranscribe}
            disabled={!canTranscribe}
            size="xl"
            variant="default"
            className="min-w-[200px]"
            aria-describedby="transcribe-button-description"
            tabIndex={0}
          >
            <FileAudio className="mr-2 h-4 w-4" aria-hidden="true" />
            Transcribir Audio
          </Button>
          <div id="transcribe-button-description" className="sr-only">
            Iniciar transcripción del audio grabado o subido
          </div>
          {!backendOnline && (
            <p 
              className="text-sm text-muted-foreground mt-2 text-center"
              role="status"
              aria-live="polite"
            >
              Esperando conexión al servidor...
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {!audioBlob && !hasResults && !error && state === 'idle' && (
        <EmptyState
          icon={FileAudio}
          title="Listo para transcribir"
          description="Graba tu voz o sube un archivo para comenzar la transcripción automática"
        />
      )}

      {/* Backend Status - Moved to bottom */}
      <div className="flex justify-center">
        <BackendStatus 
          onStatusChange={setBackendOnline}
          autoRefresh={true}
        />
      </div>
    </div>
  );
};