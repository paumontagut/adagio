import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder } from '@/components/AudioRecorder';
import { FileUpload } from '@/components/FileUpload';
import { Loader2, Copy, Download } from 'lucide-react';

interface TranscriptionResponse {
  transcription: string;
}

export const TranscribeView = () => {
  const [transcription, setTranscription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

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
    
    try {
      const formData = new FormData();
      formData.append('audio_file', fileToTranscribe);
      formData.append('lang', 'es');

      const response = await fetch('/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: TranscriptionResponse = await response.json();
      
      if (!data.transcription || data.transcription.trim() === '') {
        throw new Error('No se detectó audio');
      }
      
      setTranscription(data.transcription);
      toast({
        title: "Transcripción completada",
        description: "Audio transcrito correctamente",
      });
    } catch (error) {
      console.error('Error transcribing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      toast({
        title: "Error en la transcripción",
        description: errorMessage.includes('No se detectó audio') 
          ? "No se detectó audio en el archivo" 
          : "Error al procesar el audio. Verifica el formato.",
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
    setUploadedFile(null); // Clear uploaded file when recording
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setAudioBlob(null); // Clear recorded audio when uploading
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

      {/* Transcribe Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleTranscribe}
          disabled={!hasAudio || isLoading}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
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