import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder } from '@/components/AudioRecorder';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Loader2, RefreshCw, MessageSquare, CheckCircle } from 'lucide-react';

// Placeholder phrases - will be replaced with API call later
const samplePhrases = [
  "Buenos días, ¿cómo está usted?",
  "Necesito ayuda con esto, por favor",
  "El clima está muy agradable hoy",
  "Me gustaría hacer una reservación",
  "¿Puede repetir eso, por favor?",
  "Muchas gracias por su ayuda",
  "Hasta luego, que tenga un buen día",
  "¿Dónde está la estación más cercana?",
];

interface RecordingData {
  phrase_text: string;
  audio_url: string;
  duration_ms: number;
  sample_rate: number;
  format: string;
  device_label: string;
  created_at: string;
}

export const TrainView = () => {
  const [currentPhrase, setCurrentPhrase] = useState(() => 
    samplePhrases[Math.floor(Math.random() * samplePhrases.length)]
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const getNewPhrase = useCallback(() => {
    const newPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
    setCurrentPhrase(newPhrase);
    setAudioBlob(null);
    setError(null);
    setIsSuccess(false);
  }, []);

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      toast({
        title: "Error",
        description: "Por favor graba el audio primero",
        variant: "destructive"
      });
      return;
    }

    if (!hasConsented) {
      toast({
        title: "Error", 
        description: "Por favor acepta los términos de uso de datos",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create FormData to upload audio file
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');
      formData.append('phrase_text', currentPhrase);
      formData.append('user_id', 'anonymous'); // Anonymous for now
      
      // Get audio metadata
      const duration_ms = audioBlob.size > 0 ? 5000 : 0; // Placeholder - would need real duration
      formData.append('duration_ms', duration_ms.toString());
      formData.append('sample_rate', '16000');
      formData.append('format', 'webm');
      formData.append('device_label', 'Browser MediaRecorder');

      // This would be replaced with actual backend endpoint
      const response = await fetch('/api/recordings', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('LARGE_FILE');
        }
        if (response.status === 507) {
          throw new Error('STORAGE_FULL');
        }
        throw new Error(`HTTP_${response.status}`);
      }

      const data: RecordingData = await response.json();
      
      setIsSuccess(true);
      toast({
        title: "¡Gracias por tu ayuda!",
        description: "Tu grabación ha sido guardada correctamente",
      });

      // Reset for next recording after a delay
      setTimeout(() => {
        setAudioBlob(null);
        setHasConsented(false);
        setIsSuccess(false);
        getNewPhrase();
      }, 2000);
      
    } catch (error) {
      console.error('Error uploading recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'UNKNOWN';
      setError(errorMessage);
      
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la grabación",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorDetails = (errorCode: string) => {
    switch (errorCode) {
      case 'LARGE_FILE':
        return {
          title: 'Grabación muy larga',
          description: 'La grabación supera el límite de tiempo o tamaño.',
          solution: 'Mantén las grabaciones por debajo de 30 segundos y habla más cerca del micrófono.'
        };
      case 'STORAGE_FULL':
        return {
          title: 'Almacenamiento lleno',
          description: 'El servidor no tiene espacio disponible para más grabaciones.',
          solution: 'Inténtalo más tarde o contacta con el administrador del sistema.'
        };
      default:
        if (errorCode.includes('NetworkError')) {
          return {
            title: 'Error de conexión',
            description: 'No se pudo enviar la grabación al servidor.',
            solution: 'Verifica tu conexión a internet e inténtalo de nuevo.'
          };
        }
        return {
          title: 'Error al guardar',
          description: 'Ocurrió un problema inesperado al guardar tu grabación.',
          solution: 'Inténtalo de nuevo en unos momentos.'
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Entrenamiento del Modelo
        </h2>
        <p className="text-muted-foreground">
          Ayúdanos a mejorar el reconocimiento grabando esta frase
        </p>
      </div>

      {/* Current Phrase */}
      <Card className="p-8 text-center bg-secondary/20">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-foreground">Frase a grabar:</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={getNewPhrase}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Nueva frase
          </Button>
        </div>
        <p className="text-2xl font-medium text-foreground leading-relaxed">
          "{currentPhrase}"
        </p>
      </Card>

      {/* Success State */}
      {isSuccess && (
        <Card className="p-6 border-success/20 bg-success/5 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="font-medium text-success">¡Grabación enviada!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Gracias por ayudar a mejorar el sistema
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <ErrorState 
          {...getErrorDetails(error)}
          onRetry={() => setError(null)}
        />
      )}

      {/* Audio Recording */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 text-foreground">Grabación</h3>
        <AudioRecorder 
          onRecordingComplete={handleRecordingComplete}
          maxDuration={30}
        />
      </Card>

      {/* Empty State when no recording */}
      {!audioBlob && !error && !isSuccess && (
        <EmptyState
          icon={MessageSquare}
          title="Graba la frase"
          description="Presiona el botón de grabar y lee la frase en voz alta para ayudar a entrenar el modelo"
        />
      )}

      {/* Consent and Privacy */}
      {audioBlob && !isSuccess && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">
              Consentimiento y Privacidad
            </h3>
            
            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent"
                checked={hasConsented}
                onCheckedChange={(checked) => setHasConsented(checked === true)}
              />
              <label 
                htmlFor="consent" 
                className="text-sm text-foreground leading-relaxed cursor-pointer"
              >
                Autorizo el uso de esta grabación para mejorar el sistema de reconocimiento 
                de voz de Adagio. Entiendo que mis datos serán tratados de forma confidencial 
                y utilizados únicamente para fines de investigación y desarrollo.
              </label>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Aviso de Privacidad:</strong> Tu grabación se almacenará de forma 
                segura y anónima. No se recopilan datos personales identificables. 
                Puedes retirar tu consentimiento en cualquier momento contactando 
                con el equipo de Adagio.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Submit Button */}
      {audioBlob && hasConsented && !isSuccess && (
        <div className="flex justify-center gap-4">
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="xl"
            variant="accent"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Grabación'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};