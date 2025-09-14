import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder } from '@/components/AudioRecorder';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ConsentModal } from '@/components/ConsentModal';
import { TrainingConsentModal } from '@/components/TrainingConsentModal';
import { useAuth } from '@/contexts/AuthContext';
import { getGuestSessionId } from '@/lib/guestSession';
import { getParticipantName, setParticipantName } from '@/lib/participant';

import { AudioMetricsDisplay } from '@/components/AudioMetricsDisplay';
import { ProcessingResult } from '@/lib/audioProcessor';
import { sessionManager } from '@/lib/sessionManager';
// Removed client-side encryption (now server-side)
import { Loader2, RefreshCw, MessageSquare, CheckCircle, BarChart3, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { phraseService } from '@/services/phraseService';

// Get constants for direct fetch calls
const SUPABASE_URL = "https://cydqkoohhzesogvctvhy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZHFrb29oaHplc29ndmN0dmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDE2NzEsImV4cCI6MjA3MTc3NzY3MX0.UP09-Y6AqFsmVQLAx6qkRqNjqXNG4FFt7dgYvuIFzN8";
interface RecordingData {
  phrase_text: string;
  audio_url: string;
  duration_ms: number;
  sample_rate: number;
  format: string;
  device_label: string;
  created_at: string;
}
const TrainView = () => {
  const [currentPhrase, setCurrentPhrase] = useState(() => phraseService.getRandomPhrase());
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showTrainingConsentModal, setShowTrainingConsentModal] = useState(true);
  const [consentTrain, setConsentTrain] = useState(false);
  const [consentStore, setConsentStore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  // const [encryptionKey, setEncryptionKey] = useState<string>(''); // removed
  const [currentKeyVersion, setCurrentKeyVersion] = useState<number>(1);
  const [fullName, setFullName] = useState<string>('');
  const [ageRange, setAgeRange] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user already gave consent and track page view
  useEffect(() => {
    const initializeComponent = async () => {
      // Initialize phrase service
      await phraseService.initialize();
      
      const session = sessionManager.getSession();
      if (session) {
        setHasConsented(session.consentGiven);
      }
      sessionManager.pageView('train');
      
      // Generate or retrieve encryption key
      initializeEncryption();

      // Precargar nombre desde perfil de usuario si está disponible
      loadUserProfile();
      
      // Set initial random phrase after service is initialized
      setCurrentPhrase(phraseService.getRandomPhrase());
    };
    
    initializeComponent();
  }, [user]);

  const loadUserProfile = async () => {
    // Si ya tenemos un nombre guardado, usarlo
    const storedName = getParticipantName();
    if (storedName) {
      setFullName(storedName);
      return;
    }

    // Si el usuario está autenticado con Google, precargar desde metadata
    if (user?.user_metadata) {
      const metaName = user.user_metadata.full_name || user.user_metadata.name;
      if (metaName) {
        setParticipantName(metaName);
        setFullName(metaName);
      }
    }
  };

  const initializeEncryption = async () => {
    try {
      // Get current key version from server (for display only)
      const { data, error } = await supabase.functions.invoke('encrypted-audio-api', {
        body: { action: 'get-key-version' }
      });
      if (!error && data && typeof data.currentKeyVersion === 'number') {
        setCurrentKeyVersion(data.currentKeyVersion);
      }
    } catch (error) {
      console.error('Error initializing encryption:', error);
    }
  };
  const getNewPhrase = useCallback(() => {
    const newPhrase = phraseService.getRandomPhrase();
    setCurrentPhrase(newPhrase);
    setAudioBlob(null);
    setError(null);
    setIsSuccess(false);
  }, []);
  const handleRecordingComplete = (blob: Blob, result?: ProcessingResult) => {
    setAudioBlob(blob);
    setProcessingResult(result || null);
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

    // Verificar que tenemos el nombre del participante
    const participantName = getParticipantName() || fullName.trim();
    if (!participantName) {
      toast({
        title: "Nombre requerido",
        description: "Necesitamos tu nombre para asociar la grabación a tu consentimiento",
        variant: "destructive"
      });
      setShowTrainingConsentModal(true);
      return;
    }

    // Validate audio quality if processing result exists
    if (processingResult && !processingResult.isValid) {
      toast({
        title: "Audio no válido",
        description: "Por favor mejora la calidad del audio antes de enviar",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      // Server-side encryption: no client key needed

      const session = sessionManager.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      // Use processed audio if available, otherwise use original
      const audioToUpload = processingResult?.blob || audioBlob;

      // Get audio metadata
      const duration_ms = processingResult?.metrics.duration ? 
        Math.round(processingResult.metrics.duration * 1000) : 5000;

      // Convert raw audio to base64 for server-side encryption
      const buffer = await audioToUpload.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const rawBase64 = btoa(binary);

      console.log('Sending raw audio for server-side encryption...');

      // Send RAW data to secure edge function (server encrypts & stores)
      const { data: responseData, error: uploadError } = await supabase.functions.invoke(
        'encrypted-audio-api',
        {
          body: {
            action: 'store-audio-raw',
            sessionId: session.sessionId,
            phraseText: currentPhrase,
            rawBlob: rawBase64,
            durationMs: duration_ms,
            sampleRate: processingResult?.metrics.sampleRate || 16000,
            audioFormat: 'wav',
            deviceInfo: `Browser MediaRecorder - ${navigator.userAgent.substring(0, 100)}`,
            qualityScore: processingResult?.isValid ? 0.95 : 0.70,
            consentTrain: consentTrain,
            consentStore: consentStore,
            fullName: fullName.trim()
          }
        }
      );

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Encrypted audio stored successfully:', responseData);

      // Save recording to database (if user is logged in or as guest)
      try {
        const recordingData = {
          user_id: user?.id || null,
          session_id: user ? null : getGuestSessionId(),
          phrase_text: currentPhrase,
          audio_url: responseData?.fileUrl || 'encrypted_storage',
          duration_ms: duration_ms,
          sample_rate: processingResult?.metrics.sampleRate || 16000,
          format: 'wav',
          device_label: `Browser MediaRecorder - ${navigator.userAgent.substring(0, 100)}`,
          consent_train: consentTrain,
          consent_store: consentStore,
          full_name: participantName
        };

        const { error: dbError } = await supabase
          .from('recordings')
          .insert([recordingData]);

        if (dbError) {
          console.error('Database save error:', dbError);
          // Don't throw here, as the main upload succeeded
        } else {
          console.log('Recording saved to database successfully');
        }
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
        // Don't throw here, as the main upload succeeded
      }

      // Track analytics
      sessionManager.trainUpload();
      sessionManager.trainUploadSuccess();

      setIsSuccess(true);
      toast({
        title: "¡Grabación cifrada y guardada!",
        description: user ? 
          "Tu audio ha sido cifrado y guardado en tu cuenta" :
          "Tu audio ha sido cifrado y almacenado de forma segura"
      });

      // Reset for next recording after a delay
      setTimeout(() => {
        setAudioBlob(null);
        setProcessingResult(null);
        setIsSuccess(false);
        setFullName('');
        getNewPhrase();
      }, 3000);

    } catch (error) {
      console.error('Error in encrypted upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'ENCRYPTION_ERROR';
      setError(errorMessage);

      sessionManager.trainUploadError(errorMessage);
      toast({
        title: "Error de cifrado",
        description: "No se pudo cifrar y guardar la grabación",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleConsentGiven = (analyticsConsent: boolean) => {
    sessionManager.updateConsent(true);
    sessionManager.updateAnalyticsConsent(analyticsConsent);
    setHasConsented(true);
    setShowConsentModal(false);

    // Now proceed with submission
    handleSubmit();
  };
  const handleAnalyticsToggle = (enabled: boolean) => {
    sessionManager.updateAnalyticsConsent(enabled);
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
  const handleTrainingConsentGiven = async (
    consentTrainValue: boolean, 
    fullNameValue: string,
    ageRangeValue: string,
    countryValue: string,
    regionValue: string
  ) => {
    setConsentTrain(consentTrainValue);
    setConsentStore(true); // Set to true by default since storage consent is no longer asked
    setFullName(fullNameValue);
    setAgeRange(ageRangeValue);
    setRegion(`${countryValue}-${regionValue}`); // Combine country and region
    setShowTrainingConsentModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Training Consent Modal - Must appear first */}
      <TrainingConsentModal 
        isOpen={showTrainingConsentModal} 
        onConsentGiven={handleTrainingConsentGiven}
        onCancel={() => { setShowTrainingConsentModal(false); navigate('/?tab=transcribe'); }}
      />
      
      {/* Consent Modal */}
      <ConsentModal isOpen={showConsentModal} onConsentGiven={handleConsentGiven} />

      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Entrenamiento del Modelo
        </h2>
        <p className="text-muted-foreground">
          Ayúdanos a mejorar el reconocimiento grabando esta frase
          {!user && (
            <span className="block text-sm mt-1 text-muted-foreground/80">
              💡 Inicia sesión para guardar tu progreso y ver tu historial
            </span>
          )}
          <span className="block text-sm mt-1 text-muted-foreground/60">
            📚 Dataset: {phraseService.getTotalCount()} frases disponibles
          </span>
        </p>
      </div>

      {/* Analytics Toggle - Hidden for now */}
      {/* {hasConsented && <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Estadísticas anónimas</p>
                <p className="text-xs text-muted-foreground">
                  Ayuda a mejorar la aplicación compartiendo datos de uso
                </p>
              </div>
            </div>
            <Switch checked={sessionManager.getSession()?.shareAnalytics || false} onCheckedChange={handleAnalyticsToggle} />
          </div>
        </Card>} */}

      {/* Current Phrase */}
      <Card className="p-8 text-center bg-[#f5f8de]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-foreground">Frase a grabar:</h3>
            <div className="flex items-center gap-2 mt-1">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                Cifrado AES-256 • Clave v{currentKeyVersion}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={getNewPhrase} className="flex items-center gap-2 bg-[#0d0c1d] text-white">
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
      {error && <ErrorState {...getErrorDetails(error)} onRetry={() => setError(null)} />}

      {/* Audio Recording - Only show if training consent given */}
      {!showTrainingConsentModal && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4 text-foreground">Grabación</h3>
          <AudioRecorder onRecordingComplete={handleRecordingComplete} maxDuration={30} />
        </Card>
      )}

      {/* Empty State when no recording */}
      {!audioBlob && !error && !isSuccess && (
        <EmptyState 
          icon={MessageSquare} 
          title="Graba la frase" 
          description="Presiona el botón de grabar y lee la frase en voz alta para ayudar a entrenar el modelo" 
        />
      )}


      {/* Submit Button */}
      {audioBlob && !isSuccess && (
        <div className="flex justify-center gap-4">
          <Button onClick={handleSubmit} disabled={isSubmitting} size="xl" variant="accent">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cifrando y enviando...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Enviar Cifrado (AES-256)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export { TrainView };