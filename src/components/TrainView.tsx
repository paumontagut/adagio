import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder, AudioRecorderHandle } from '@/components/AudioRecorder';
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
import { Loader2, RefreshCw, MessageSquare, CheckCircle, BarChart3, Volume2, ArrowLeft, ArrowRight, RotateCcw, Play } from 'lucide-react';
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
  const [fullName, setFullName] = useState<string>('');
  const [ageRange, setAgeRange] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [phraseCount, setPhraseCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [handsFreeModeActive, setHandsFreeModeActive] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioRecorderRef = useRef<AudioRecorderHandle>(null);
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

  // No encryption initialization needed anymore
  const getNewPhrase = useCallback(() => {
    const newPhrase = phraseService.getRandomPhrase();
    setCurrentPhrase(newPhrase);
    setAudioBlob(null);
    setError(null);
    setIsSuccess(false);
  }, []);
  const handleRecordingComplete = (blob: Blob, result?: ProcessingResult) => {
    console.log('[TrainView] Recording complete, blob size:', blob.size);
    setAudioBlob(blob);
    setProcessingResult(result || null);
    setError(null);
    setIsRecording(false);
    
    if (blob.size > 0) {
      toast({
        title: "Grabación lista",
        description: "Puedes escucharla o enviarla"
      });
    } else {
      toast({
        title: "Error",
        description: "No se capturó audio",
        variant: "destructive"
      });
    }
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
      const session = sessionManager.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      // Use processed audio if available, otherwise use original
      const audioToUpload = processingResult?.blob || audioBlob;

      // Get audio metadata
      const duration_ms = processingResult?.metrics.duration ? 
        Math.round(processingResult.metrics.duration * 1000) : 5000;

      // Convert audio to base64 for plaintext upload
      const buffer = await audioToUpload.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const rawBase64 = btoa(binary);

      console.log('Sending plaintext audio...');

      // Send plaintext audio to edge function
      const { data: responseData, error: uploadError } = await supabase.functions.invoke(
        'encrypted-audio-api',
        {
          body: {
            action: 'store-audio-plaintext',
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

      console.log('Plaintext audio stored successfully:', responseData);

      // Save recording to database (if user is logged in or as guest)
      try {
        const recordingData = {
          user_id: user?.id || null,
          session_id: user ? null : getGuestSessionId(),
          phrase_text: currentPhrase,
          audio_url: responseData?.unencryptedFilePath || 'audio_raw/unknown',
          duration_ms: duration_ms,
          sample_rate: processingResult?.metrics.sampleRate || 16000,
          format: 'wav',
          device_label: `Browser MediaRecorder - ${navigator.userAgent.substring(0, 100)}`,
          consent_train: consentTrain,
          consent_store: consentStore,
          full_name: participantName
        };

        // Use untyped query since table may not exist in generated types
        const { error: dbError } = await (supabase as any)
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
        title: "¡Grabación guardada!",
        description: user ? 
          "Tu audio ha sido guardado en tu cuenta" :
          "Tu audio ha sido almacenado correctamente"
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
        title: "Error al guardar",
        description: "No se pudo guardar la grabación",
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
    try {
      // Guardar evidencia de consentimiento en la base de datos
      const sessionId = getGuestSessionId();
      
      // Preparar los datos de evidencia completa
      const consentEvidenceData = {
        form_version: '1.0',
        consent_train: consentTrainValue,
        consent_store: false,
        full_name: fullNameValue,
        age_range: ageRangeValue,
        country: countryValue,
        region: regionValue,
        adult_declaration: true,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        language: navigator.language
      };

      const { data, error } = await supabase.functions.invoke('consent-evidence-handler', {
        body: {
          session_pseudonym: sessionId,
          full_name: fullNameValue,
          email: null, // Email opcional para guest users
          age_range: ageRangeValue,
          country: countryValue,
          region: regionValue,
          adult_declaration: true,
          consent_train: consentTrainValue,
          consent_store: false,
          consent_evidence_data: consentEvidenceData,
          ip_address: null, // Se capturará en el servidor
          user_agent: navigator.userAgent,
          device_info: `${navigator.platform} - ${navigator.userAgent}`
        }
      });

      if (error) {
        console.error('Error saving consent evidence:', error);
        toast({
          title: "Advertencia",
          description: "Tu consentimiento fue registrado pero hubo un problema al guardar la evidencia completa.",
          variant: "default"
        });
      } else {
        console.log('Consent evidence saved successfully:', data);
      }
    } catch (err) {
      console.error('Error in handleTrainingConsentGiven:', err);
    }

    // Continuar con el flujo normal
    setConsentTrain(consentTrainValue);
    setConsentStore(false); // No solicitamos este consentimiento
    setFullName(fullNameValue);
    setAgeRange(ageRangeValue);
    setRegion(`${countryValue}-${regionValue}`);
    setShowTrainingConsentModal(false);
  };

  const handlePlayPhrase = async () => {
    // TODO: Implement TTS to play the phrase
    toast({
      title: "Funcionalidad próximamente",
      description: "Pronto podrás escuchar la frase antes de grabarla"
    });
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
      // Stop recording
      console.log('[TrainView] Stopping recording...');
      audioRecorderRef.current?.stopRecording();
      setIsRecording(false);
    } else {
      // Clear previous recording before starting new one
      setAudioBlob(null);
      setProcessingResult(null);
      setError(null);
      
      try {
        console.log('[TrainView] Starting recording...');
        const success = await audioRecorderRef.current?.startRecording();
        console.log('[TrainView] startRecording returned:', success);
        
        if (success) {
          setIsRecording(true);
          toast({
            title: "Grabando...",
            description: "Habla claramente cerca del micrófono"
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo iniciar la grabación",
            variant: "destructive"
          });
          setIsRecording(false);
        }
      } catch (err) {
        console.error('[TrainView] Error starting recording:', err);
        toast({
          title: "Error",
          description: "Error al iniciar la grabación",
          variant: "destructive"
        });
        setIsRecording(false);
      }
    }
  };

  const handlePlayRecording = () => {
    if (audioBlob && audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        const url = URL.createObjectURL(audioBlob);
        audioElementRef.current.src = url;
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleReRecord = () => {
    setAudioBlob(null);
    setProcessingResult(null);
    setIsSuccess(false);
    setError(null);
    setIsRecording(false);
    setIsPlaying(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!e.key) return; // Guard against undefined key
      
      if (e.ctrlKey && !e.repeat) {
        handlePlayPhrase();
      }
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        if (audioBlob) {
          handleSubmit();
        } else {
          handleRecordToggle();
        }
      }
      if (e.altKey && !e.repeat) {
        if (audioBlob) {
          handleReRecord();
        }
      }
      if (e.key.toLowerCase() === 'p' && !e.repeat) {
        if (audioBlob) {
          handlePlayRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [audioBlob, isRecording, isPlaying]);

  return (
    <div className="min-h-[600px] relative">
      {/* Training Consent Modal - Must appear first */}
      <TrainingConsentModal 
        isOpen={showTrainingConsentModal} 
        onConsentGiven={handleTrainingConsentGiven}
        onCancel={() => navigate('/?tab=transcribe')}
      />
      
      {/* Consent Modal */}
      <ConsentModal isOpen={showConsentModal} onConsentGiven={handleConsentGiven} />

      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-12">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/?tab=transcribe')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={getNewPhrase}
          className="text-muted-foreground hover:text-foreground"
        >
          Cambiar frases
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Phrase Card - Flashcard Style */}
        <Card className="p-12 text-center shadow-lg border-2">
          <h1 className="text-4xl font-bold text-foreground mb-8 leading-relaxed">
            {currentPhrase}
          </h1>

          {/* Success Message */}
          {isSuccess && (
            <div className="flex items-center justify-center gap-2 text-success mb-6">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">¡Conseguido!</span>
            </div>
          )}

          {/* Listen Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPhrase}
              className="text-primary hover:text-primary/80 flex items-center gap-2"
            >
              <Volume2 className="h-5 w-5" />
              <span>Escuchar</span>
              <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Ctrl</span>
            </Button>
          </div>
        </Card>

        {/* Recording Controls */}
        {!showTrainingConsentModal && (
          <div className="flex flex-col items-center gap-8">
            {/* Recording Status Indicator */}
            {isRecording && (
              <div className="flex items-center gap-3 text-destructive animate-pulse">
                <div className="w-4 h-4 rounded-full bg-destructive" />
                <span className="font-semibold text-lg">Grabando...</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-12">
              {/* Re-record Button */}
              {audioBlob && !isRecording && (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReRecord}
                    className="h-12 w-12 rounded-full text-primary hover:text-primary/80"
                  >
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                  <span className="text-sm text-muted-foreground">Re-grabar</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Alt</span>
                </div>
              )}

              {/* Main Record/Stop Button */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={audioBlob && !isRecording ? handleSubmit : handleRecordToggle}
                  disabled={isSubmitting}
                  className={`h-40 w-40 rounded-full flex flex-col items-center justify-center text-white font-semibold text-lg transition-all shadow-lg hover:shadow-xl
                    ${audioBlob && !isRecording
                      ? 'bg-green-600 hover:bg-green-700' 
                      : isRecording 
                      ? 'bg-destructive hover:bg-destructive/90' 
                      : 'bg-[#F17C58] hover:bg-[#E06844]'
                    }
                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <span>Toca</span>
                      <span>{audioBlob && !isRecording ? 'para enviar' : isRecording ? 'para parar' : 'para grabar'}</span>
                    </>
                  )}
                </button>
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded">[Espacio]</span>
              </div>

              {/* Play Button */}
              {audioBlob && !isRecording && (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePlayRecording}
                    className={`h-12 w-12 rounded-full ${isPlaying ? 'text-green-600' : 'text-primary'} hover:text-primary/80`}
                  >
                    <Play className="h-6 w-6" />
                  </Button>
                  <span className="text-sm text-muted-foreground">{isPlaying ? 'Reproduciendo' : 'Reproducir'}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">P</span>
                </div>
              )}
            </div>

            {/* Recording Ready Message */}
            {audioBlob && !isRecording && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Grabación lista - Escúchala o envíala</span>
              </div>
            )}
          </div>
        )}

        {/* Hidden Audio Recorder - controlled via ref */}
        <div className="hidden">
          <AudioRecorder ref={audioRecorderRef} onRecordingComplete={handleRecordingComplete} maxDuration={30} />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              // Go to previous phrase logic
              getNewPhrase();
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              console.log('[TrainView] Next button clicked');
              setAudioBlob(null);
              setProcessingResult(null);
              setError(null);
              setIsSuccess(false);
              setIsRecording(false);
              setIsPlaying(false);
              getNewPhrase();
              setPhraseCount(prev => prev + 1);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            Siguiente
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Hidden audio element for playback */}
      <audio
        ref={audioElementRef}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
};

export { TrainView };