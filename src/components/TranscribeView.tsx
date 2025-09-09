import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { RecorderUploader } from '@/components/RecorderUploader';
import { BackendStatus } from '@/components/BackendStatus';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import ComparisonView from '@/components/ComparisonView';
import { sessionManager } from '@/lib/sessionManager';
import { transcribeService, type TranscribeError, type TranscribeProvider } from '@/services/transcribe';
import { speakWithElevenLabs } from '@/services/tts';
import type { ConversionResult } from '@/lib/audioConverter';
import { 
  Loader2, 
  Copy, 
  Download, 
  FileAudio, 
  Upload, 
  Waves, 
  CheckCircle,
  Bot,
  Server,
  Zap,
  GitCompare,
  Volume2,
  Pause,
  Square
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type TranscribeState = 'idle' | 'uploading' | 'transcribing' | 'completed' | 'error';

interface TranscriptionResult {
  text: string;
  provider: string;
}

export const TranscribeView = () => {
  const [adagioResult, setAdagioResult] = useState<TranscriptionResult | null>(null);
  const [state, setState] = useState<TranscribeState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMetadata, setAudioMetadata] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<TranscribeError | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
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

  const transcribeWithProvider = async (provider: TranscribeProvider): Promise<TranscriptionResult> => {
    transcribeService.setProvider(provider);
    const fileName = audioMetadata?.format === 'wav' ? 'audio.wav' : 'audio.mp3';
    const fileType = audioMetadata?.format === 'wav' ? 'audio/wav' : 'audio/mp3';
    const audioFile = new File([audioBlob!], fileName, { type: fileType });
    
    const result = await transcribeService.transcribeFile(audioFile);
    return {
      text: result.text,
      provider: result.provider || transcribeService.getProviderInfo().name
    };
  };

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
    setAdagioResult(null);

    // Track analytics
    sessionManager.transcribeRequest();
    
    // Timers and flags for UI state transitions
    let progressIntervalId: number | null = null;
    let toTranscribingTimeoutId: number | null = null;
    let finished = false;
    
    try {
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

      // Transcribe only with Adagio
      const result = await transcribeWithProvider('adagio');
      setAdagioResult(result);

      // Marcar como finalizado y limpiar timers
      finished = true;
      if (toTranscribingTimeoutId) clearTimeout(toTranscribingTimeoutId);
      if (progressIntervalId) clearInterval(progressIntervalId);
      setUploadProgress(100);

      setState('completed');

      // Track success analytics
      const duration = audioMetadata?.duration || 0;
      sessionManager.transcribeSuccess(duration);

      toast({
        title: "Transcripción completada",
        description: "Adagio ha procesado el audio exitosamente"
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

  const handleCopyTranscription = useCallback((text: string, provider: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: `Transcripción de ${provider} copiada al portapapeles`,
      });
    }
  }, [toast]);

  const handleDownloadTranscription = useCallback((text: string, provider: string) => {
    if (text) {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcripcion-${provider.toLowerCase()}.txt`;
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

  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setAudioBlob(null);
    setAudioMetadata(null);
    setAdagioResult(null);
    setError(null);
    setState('idle');
    setUploadProgress(0);
    // Stop any playing audio
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      setAudioPlayer(null);
    }
    setIsLoadingTTS(false);
    setResetKey(prev => prev + 1); // Force RecorderUploader to reset
  };

  const handleSpeak = async () => {
    if (!adagioResult?.text?.trim()) return;
    
    setIsLoadingTTS(true);
    try {
      const audio = await speakWithElevenLabs(adagioResult.text);
      setAudioPlayer(audio);
      
      // Set up event listeners
      audio.onended = () => {
        setAudioPlayer(null);
      };
      
      audio.onerror = () => {
        setAudioPlayer(null);
        toast({
          title: "Error de audio",
          description: "No se pudo reproducir el audio generado",
          variant: "destructive"
        });
      };
      
      await audio.play();
      
      toast({
        title: "Reproduciendo",
        description: "Audio generado con ElevenLabs"
      });
      
    } catch (error) {
      console.error('TTS error:', error);
      toast({
        title: "Error de síntesis de voz",
        description: "No se pudo generar el audio",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTTS(false);
    }
  };

  const handleStopAudio = () => {
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      setAudioPlayer(null);
    }
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
  const hasResults = adagioResult;
  
  // Debug info - remove in production
  console.log('TranscribeView state:', { 
    audioBlob: !!audioBlob, 
    backendOnline, 
    isProcessing, 
    canTranscribe,
    state,
    hasResults: !!hasResults
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
            Compara diferentes tecnologías de transcripción de audio
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="adagio" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="adagio" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Transcripción Adagio
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            ChatGPT vs Adagio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adagio" className="space-y-6">
      {/* Audio Input Section */}
      <Card className="p-6" role="region" aria-labelledby="audio-input-heading">
        <div className="space-y-4">
          <h3 id="audio-input-heading" className="text-lg font-medium text-foreground">
            Entrada de Audio
          </h3>
          <RecorderUploader
            key={resetKey}
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
          </div>
        </Card>
      )}

      {/* Transcription Results - Only Adagio */}
      {state === 'completed' && adagioResult && (
        <Card className="p-6" role="region" aria-labelledby="results-heading">
          <h3 id="results-heading" className="text-lg font-medium text-foreground mb-4">
            Resultado de Transcripción
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Server className="h-3 w-3" />
                Adagio
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyTranscription(adagioResult.text, 'Adagio')}
                  title="Copiar transcripción"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadTranscription(adagioResult.text, 'Adagio')}
                  title="Descargar transcripción"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {/* TTS Button */}
                {audioPlayer ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStopAudio}
                    title="Detener reproducción"
                    aria-live="polite"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSpeak}
                    disabled={isLoadingTTS || !adagioResult.text.trim()}
                    title="Reproducir con ElevenLabs"
                    aria-live="polite"
                  >
                    {isLoadingTTS ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            <Textarea
              value={adagioResult.text}
              readOnly
              className="min-h-[120px] resize-none bg-muted/30"
              placeholder="Transcripción de Adagio aparecerá aquí..."
              aria-label="Transcripción de Adagio"
            />
          </div>
        </Card>
      )}

      {/* Audio metadata and reset */}
      {state === 'completed' && hasResults && audioMetadata && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
            <div className="text-center sm:text-left">
              Procesado: {audioMetadata.format.toUpperCase()} • 
              {audioMetadata.sampleRate}Hz • 
              {audioMetadata.channels} canal{audioMetadata.channels !== 1 ? 'es' : ''} • 
              Duración: {Math.round(audioMetadata.duration)}s
            </div>
            
            <Button
              variant="outline"
              onClick={handleReset}
              size="sm"
            >
              Transcribir otro audio
            </Button>
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
            className="min-w-[250px]"
            aria-describedby="transcribe-button-description"
            tabIndex={0}
          >
            <FileAudio className="mr-2 h-4 w-4" aria-hidden="true" />
            Transcribir con Adagio
          </Button>
          <div id="transcribe-button-description" className="sr-only">
            Iniciar transcripción con Adagio
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
          title="Listo para transcripción"
          description="Graba tu voz o sube un archivo para transcribir con Adagio"
        />
      )}

      {/* Backend Status - Moved to bottom */}
      <div className="flex justify-center">
        <BackendStatus 
          onStatusChange={setBackendOnline}
          autoRefresh={true}
        />
      </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <ComparisonView />
        </TabsContent>
      </Tabs>
    </div>
  );
};