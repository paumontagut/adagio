import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ConsentModal } from '@/components/ConsentModal';
import { AudioMetricsDisplay } from '@/components/AudioMetricsDisplay';
import { audioProcessor, ProcessingResult } from '@/lib/audioProcessor';
import { sessionManager } from '@/lib/sessionManager';
import { Mic, MicOff, Play, Pause, RotateCcw, Settings } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, processingResult?: ProcessingResult) => void;
  maxDuration?: number; // in seconds
}

interface AudioDevice {
  deviceId: string;
  label: string;
}

export interface AudioRecorderHandle {
  startRecording: () => Promise<boolean>;
  stopRecording: () => void;
  isRecording: boolean;
}

export const AudioRecorder = forwardRef<AudioRecorderHandle, AudioRecorderProps>(({ onRecordingComplete, maxDuration = 60 }, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [availableDevices, setAvailableDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('default');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { toast } = useToast();

  // Check permissions and get devices on mount
  useEffect(() => {
    checkPermissionsAndDevices();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const checkPermissionsAndDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
      stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission check

      // Get available audio devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .filter(device => device.deviceId !== 'default') // Remove duplicate default
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Micrófono ${device.deviceId.slice(0, 8)}`
        }));
      
      setAvailableDevices(audioInputs);
    } catch (error) {
      console.error('Error getting permissions:', error);
      setPermissionGranted(false);
      toast({
        title: "Permisos requeridos",
        description: "Por favor permite el acceso al micrófono para grabar audio",
        variant: "destructive"
      });
    }
  };

  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start monitoring audio level
      monitorAudioLevel();
    } catch (error) {
      console.error('Error setting up audio analyser:', error);
    }
  };

  const isRecordingRef = useRef(false);

  const monitorAudioLevel = useCallback(() => {
    if (analyserRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateLevel = () => {
        if (analyserRef.current && isRecordingRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate RMS level
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / bufferLength);
          const level = Math.min(100, (rms / 128) * 100);
          
          setAudioLevel(level);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };
      
      updateLevel();
    }
  }, []);

  const startRecording = async (): Promise<boolean> => {
    try {
      // Check permissions first - if not granted, request them
      if (permissionGranted !== true) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setPermissionGranted(true);
          stream.getTracks().forEach(track => track.stop());
        } catch (permError) {
          console.error('Permission denied:', permError);
          setPermissionGranted(false);
          toast({
            title: "Permisos requeridos",
            description: "Por favor permite el acceso al micrófono para grabar audio",
            variant: "destructive"
          });
          return false;
        }
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedDevice !== 'default' ? { exact: selectedDevice } : undefined,
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Setup audio level monitoring
      setupAudioAnalyser(stream);

      // Create MediaRecorder with preferred format
      const options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.onstart = () => {
        // Some browsers only emit data when a timeslice is used; keep a small slice.
        console.log('MediaRecorder started', { mimeType: mediaRecorder.mimeType });
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // If the browser didn't emit chunks, we can't build a recording.
        if (chunks.length === 0) {
          console.error('No audio chunks captured (MediaRecorder produced empty data)');
          toast({
            title: 'No se capturó audio',
            description: 'No se detectó entrada del micrófono. Revisa permisos y el dispositivo seleccionado.',
            variant: 'destructive'
          });

          // Cleanup
          stream.getTracks().forEach(track => track.stop());
          if (audioContextRef.current) {
            audioContextRef.current.close();
          }
          return;
        }

        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        setRecordedBlob(blob);
        
        // Process audio
        setIsProcessing(true);
        try {
          const result = await audioProcessor.processRecording(blob);
          setProcessingResult(result);
          
          // Create URL for playback
          const url = URL.createObjectURL(result.blob);
          setAudioUrl(url);
          
          onRecordingComplete(result.blob, result);
          
          // Track analytics
          sessionManager.recordStop(result.metrics.duration);
        } catch (error) {
          console.error('Error processing audio:', error);
          // Fallback to original blob
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          onRecordingComplete(blob);
        } finally {
          setIsProcessing(false);
        }
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      // Use a small timeslice so dataavailable fires reliably across browsers
      mediaRecorder.start(250);
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);
      
      // Track analytics
      sessionManager.recordStart();

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      return true;

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error al grabar",
        description: "No se pudo iniciar la grabación. Verifica los permisos del micrófono.",
        variant: "destructive"
      });
      return false;
    }
  };

  const stopRecording = useCallback(() => {
    // Stop regardless of React state - use MediaRecorder state directly
    const recorder = mediaRecorderRef.current;
    if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) {
      console.log('[AudioRecorder] Stopping recording, state:', recorder.state);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      try {
        recorder.stop();
        setIsRecording(false);
        isRecordingRef.current = false;
        console.log('[AudioRecorder] MediaRecorder.stop() called');
      } catch (err) {
        console.error('[AudioRecorder] Error stopping recorder:', err);
        setIsRecording(false);
        isRecordingRef.current = false;
        toast({
          title: "Error",
          description: "Error al detener la grabación",
          variant: "destructive"
        });
      }
    } else {
      console.log('[AudioRecorder] No active recording to stop, state:', recorder?.state);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, [toast]);

  // Expose methods via ref for parent component control
  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording,
    isRecording
  }), [isRecording, stopRecording]);

  const togglePlayback = () => {
    if (!audioUrl || !audioElementRef.current) return;

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setProcessingResult(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (permissionGranted === false) {
    return (
      <ErrorState
        title="Permisos de micrófono requeridos"
        description="Para grabar audio, necesitamos acceso a tu micrófono."
        solution="Haz clic en 'Permitir' cuando el navegador solicite permisos. Si ya los rechazaste, busca el ícono del micrófono en la barra de direcciones y actívalo."
        onRetry={checkPermissionsAndDevices}
      />
    );
  }

  if (permissionGranted === null) {
    return (
      <EmptyState
        icon={Settings}
        title="Verificando permisos"
        description="Comprobando acceso al micrófono..."
      />
    );
  }

  return (
    <div className="space-y-4" role="region" aria-labelledby="audio-recorder-heading">
      <h3 id="audio-recorder-heading" className="sr-only">Grabadora de audio</h3>
      
      {/* Recording status announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {isRecording && `Grabando audio, ${formatTime(recordingTime)} transcurridos`}
        {isProcessing && 'Procesando grabación de audio'}
        {recordedBlob && !isProcessing && 'Grabación completada y lista para transcripción'}
      </div>

      {/* Device Selection */}
      {availableDevices.length > 1 && (
        <div>
          <label 
            htmlFor="microphone-select" 
            className="text-sm font-medium text-foreground mb-2 block"
          >
            Seleccionar micrófono:
          </label>
          <Select 
            value={selectedDevice} 
            onValueChange={setSelectedDevice} 
            disabled={isRecording}
          >
            <SelectTrigger 
              id="microphone-select"
              aria-describedby="microphone-help"
            >
              <SelectValue placeholder="Selecciona un micrófono" />
            </SelectTrigger>
            <SelectContent role="listbox">
              <SelectItem value="default">Micrófono por defecto</SelectItem>
              {availableDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div id="microphone-help" className="sr-only">
            Selecciona el micrófono a usar para la grabación
          </div>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex items-center justify-center gap-4" role="toolbar" aria-label="Controles de grabación">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          size="icon"
          variant={isRecording ? "destructive" : "accent"}
          className="h-20 w-20 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label={isRecording ? "Detener grabación" : "Iniciar grabación"}
          aria-describedby="recording-status"
          tabIndex={0}
        >
          {isRecording ? 
            <MicOff className="h-8 w-8" aria-hidden="true" /> : 
            <Mic className="h-8 w-8" aria-hidden="true" />
          }
        </Button>

        {recordedBlob && (
          <>
            <Button
              onClick={togglePlayback}
              variant="outline"
              className="h-12 w-12 rounded-full hover:shadow-md transition-shadow"
              aria-label={isPlaying ? "Pausar reproducción" : "Reproducir grabación"}
              aria-describedby="playback-status"
            >
              {isPlaying ? 
                <Pause className="h-4 w-4" aria-hidden="true" /> : 
                <Play className="h-4 w-4" aria-hidden="true" />
              }
            </Button>
            
            <Button
              onClick={resetRecording}
              variant="outline"
              className="h-12 w-12 rounded-full hover:shadow-md transition-shadow"
              aria-label="Limpiar grabación y empezar de nuevo"
              aria-describedby="reset-help"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </Button>
            <div id="reset-help" className="sr-only">
              Elimina la grabación actual y permite hacer una nueva
            </div>
          </>
        )}
      </div>

      {/* Recording Status */}
      <div className="text-center space-y-2">
        <div 
          id="recording-status"
          className="text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {isProcessing ? 'Procesando audio...' 
            : isRecording ? 'Grabando...' 
            : recordedBlob ? 'Grabación completada' 
            : 'Listo para grabar'}
        </div>
        
        <div 
          className="text-lg font-mono text-foreground"
          aria-live="polite"
          aria-label={`Tiempo de grabación: ${formatTime(recordingTime)} de ${formatTime(maxDuration)} máximo`}
        >
          {formatTime(recordingTime)} / {formatTime(maxDuration)}
        </div>

        {/* Audio Level Indicator */}
        {isRecording && (
          <div 
            className="mx-auto w-48 h-2 bg-audio-inactive rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={audioLevel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Nivel de audio: ${Math.round(audioLevel)}%`}
          >
            <div 
              className="h-full bg-audio-level transition-all duration-100 ease-out"
              style={{ width: `${audioLevel}%` }}
              aria-hidden="true"
            />
          </div>
        )}
        <div id="playback-status" className="sr-only">
          {isPlaying ? 'Reproduciendo grabación' : 'Reproducción pausada'}
        </div>
      </div>

      {/* Audio Metrics Display */}
      {processingResult && (
        <AudioMetricsDisplay
          metrics={processingResult.metrics}
          isValid={processingResult.isValid}
          warnings={processingResult.warnings}
        />
      )}

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
          aria-label="Reproducción de la grabación de audio"
        />
      )}
    </div>
  );
});