import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, Square, Play, Pause, Upload, X, FileAudio, Loader2, CheckCircle } from 'lucide-react';
import { AudioRecorder } from '@/components/AudioRecorder';
import { FileUpload } from '@/components/FileUpload';
import { audioConverter, type ConversionResult } from '@/lib/audioConverter';
import { toast } from '@/hooks/use-toast';
export interface RecorderUploaderProps {
  onAudioReady: (blob: Blob, metadata: ConversionResult) => void;
  disabled?: boolean;
  maxDuration?: number;
}
type AudioSource = 'none' | 'recording' | 'upload';
export const RecorderUploader = ({
  onAudioReady,
  disabled = false,
  maxDuration = 20
}: RecorderUploaderProps) => {
  const [audioSource, setAudioSource] = useState<AudioSource>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMetadata, setAudioMetadata] = useState<ConversionResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    setIsProcessing(true);
    setProcessingProgress(20);
    try {
      // Convert to optimal format for transcription
      const converted = await audioConverter.convertAudio(blob, {
        targetSampleRate: 16000,
        targetChannels: 1,
        targetFormat: 'wav'
      });
      setProcessingProgress(60);
      setAudioBlob(converted.blob);
      setAudioMetadata(converted);
      setAudioSource('recording');
      setProcessingProgress(100);
      toast({
        title: 'Grabación lista',
        description: `Audio procesado: ${converted.channels} canal(es), ${converted.sampleRate}Hz`
      });
      onAudioReady(converted.blob, converted);
    } catch (error) {
      console.error('Error processing recording:', error);
      toast({
        title: 'Error de procesamiento',
        description: 'No se pudo procesar la grabación',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [onAudioReady]);
  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(20);
    try {
      // Check if conversion is needed
      const needsConversion = audioConverter.needsConversion(file);
      let finalBlob: Blob;
      let metadata: ConversionResult;
      if (needsConversion) {
        setProcessingProgress(40);
        const converted = await audioConverter.convertAudio(file, {
          targetSampleRate: 16000,
          targetChannels: 1,
          targetFormat: 'wav'
        });
        finalBlob = converted.blob;
        metadata = converted;
        toast({
          title: 'Archivo convertido',
          description: `Convertido a WAV 16kHz mono (${Math.round(converted.duration)}s)`
        });
      } else {
        // Use original file
        const arrayBuffer = await file.arrayBuffer();
        const tempBlob = new Blob([arrayBuffer], {
          type: file.type
        });
        metadata = {
          blob: tempBlob,
          format: file.type.includes('wav') ? 'wav' : 'mp3',
          sampleRate: 16000,
          // Assume optimal if no conversion needed
          channels: 1,
          duration: 0 // Will be updated by audio element
        };
        finalBlob = tempBlob;
      }
      setProcessingProgress(80);
      setAudioBlob(finalBlob);
      setAudioMetadata(metadata);
      setAudioSource('upload');
      setProcessingProgress(100);
      onAudioReady(finalBlob, metadata);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Error de procesamiento',
        description: 'No se pudo procesar el archivo de audio',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [onAudioReady]);
  const handlePlayPause = () => {
    if (!audioRef.current || !audioBlob) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Create URL for audio if needed
      if (!audioRef.current.src) {
        audioRef.current.src = URL.createObjectURL(audioBlob);
      }
      audioRef.current.play();
    }
  };
  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current.src = '';
      }
    }
    setAudioBlob(null);
    setAudioMetadata(null);
    setAudioSource('none');
    setIsPlaying(false);
  };
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Show processing state
  if (isProcessing) {
    return <Card className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="font-medium">Procesando audio...</h3>
            <p className="text-sm text-muted-foreground">
              Convirtiendo a formato óptimo para transcripción
            </p>
          </div>
          <div className="w-full max-w-xs">
            <Progress value={processingProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center mt-1">
              {processingProgress}%
            </p>
          </div>
        </div>
      </Card>;
  }

  // Show audio ready state
  if (audioBlob && audioMetadata) {
    return <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-medium">Audio listo para transcribir</h3>
                <p className="text-sm text-muted-foreground">
                  {audioSource === 'recording' ? 'Grabación' : 'Archivo subido'} - {audioMetadata.format.toUpperCase()}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={disabled}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-md">
            <Button variant="outline" size="sm" onClick={handlePlayPause} disabled={disabled}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <div className="flex-1 text-sm">
              <div className="flex justify-between items-center">
                <span>Duración: {formatDuration(audioMetadata.duration)}</span>
                <span>Tamaño: {formatFileSize(audioMetadata.blob.size)}</span>
              </div>
              <div className="text-muted-foreground text-xs mt-1">
                {audioMetadata.sampleRate}Hz, {audioMetadata.channels} canal{audioMetadata.channels !== 1 ? 'es' : ''}
              </div>
            </div>
          </div>

          <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} className="hidden" />
        </div>
      </Card>;
  }

  // Show input selection
  return <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recording Section */}
        

        {/* Upload Section */}
        
      </div>

      {/* Audio Recorder Component */}
      <AudioRecorder onRecordingComplete={handleRecordingComplete} maxDuration={maxDuration} />

      {/* File Upload Component */}
      <FileUpload onFileSelect={handleFileSelect} />
    </div>;
};