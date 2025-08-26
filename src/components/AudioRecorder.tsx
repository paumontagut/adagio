import { useState, useRef, useCallback, useEffect } from 'react';
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

export const AudioRecorder = ({ onRecordingComplete, maxDuration = 60 }: AudioRecorderProps) => {
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

  const monitorAudioLevel = () => {
    if (analyserRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateLevel = () => {
        if (analyserRef.current && isRecording) {
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
  };

  const startRecording = async () => {
    try {
      if (!permissionGranted) {
        await checkPermissionsAndDevices();
        if (!permissionGranted) return;
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
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        options.mimeType = 'audio/wav';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
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

      mediaRecorder.start();
      setIsRecording(true);
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

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error al grabar",
        description: "No se pudo iniciar la grabación. Verifica los permisos del micrófono.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isRecording]);

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
    <div className="space-y-4">
      {/* Device Selection */}
      {availableDevices.length > 1 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Seleccionar micrófono:
          </label>
          <Select value={selectedDevice} onValueChange={setSelectedDevice} disabled={isRecording}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un micrófono" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Micrófono por defecto</SelectItem>
              {availableDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          size="icon"
          variant={isRecording ? "destructive" : "accent"}
          className="h-20 w-20 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>

        {recordedBlob && (
          <>
            <Button
              onClick={togglePlayback}
              variant="outline"
              className="h-12 w-12 rounded-full hover:shadow-md transition-shadow"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={resetRecording}
              variant="outline"
              className="h-12 w-12 rounded-full hover:shadow-md transition-shadow"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Recording Status */}
      <div className="text-center space-y-2">
        <div className="text-sm text-muted-foreground">
          {isProcessing ? 'Procesando audio...' 
            : isRecording ? 'Grabando...' 
            : recordedBlob ? 'Grabación completada' 
            : 'Listo para grabar'}
        </div>
        
        <div className="text-lg font-mono text-foreground">
          {formatTime(recordingTime)} / {formatTime(maxDuration)}
        </div>

        {/* Audio Level Indicator */}
        {isRecording && (
          <div className="mx-auto w-48 h-2 bg-audio-inactive rounded-full overflow-hidden">
            <div 
              className="h-full bg-audio-level transition-all duration-100 ease-out"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        )}
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
        />
      )}
    </div>
  );
};