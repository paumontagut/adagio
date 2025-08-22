import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Loader2, RefreshCw } from 'lucide-react';

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
  const { toast } = useToast();

  const getNewPhrase = useCallback(() => {
    const newPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
    setCurrentPhrase(newPhrase);
    setAudioBlob(null);
  }, []);

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
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
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: RecordingData = await response.json();
      
      toast({
        title: "¡Gracias por tu ayuda!",
        description: "Tu grabación ha sido guardada correctamente",
      });

      // Reset for next recording
      setAudioBlob(null);
      setHasConsented(false);
      getNewPhrase();
      
    } catch (error) {
      console.error('Error uploading recording:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la grabación. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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

      {/* Audio Recording */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 text-foreground">Grabación</h3>
        <AudioRecorder 
          onRecordingComplete={handleRecordingComplete}
          maxDuration={30}
        />
      </Card>

      {/* Consent and Privacy */}
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

      {/* Submit Button */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={handleSubmit}
          disabled={!audioBlob || !hasConsented || isSubmitting}
          size="lg"
          className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3"
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
    </div>
  );
};