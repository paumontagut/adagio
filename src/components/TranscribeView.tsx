import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { RecorderUploader } from "@/components/RecorderUploader";
import { BackendStatus } from "@/components/BackendStatus";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import ComparisonView from "@/components/ComparisonView";
import { sessionManager } from "@/lib/sessionManager";
import { transcribeService, type TranscribeError } from "@/services/transcribe";
import { speakWithElevenLabs } from "@/services/tts";
import {
  Loader2,
  Copy,
  Download,
  FileAudio,
  CheckCircle,
  Volume2,
  Square,
  Mic,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom"; // <--- IMPORTANTE: Para la navegación

type TranscribeState = "idle" | "uploading" | "transcribing" | "completed" | "error";

interface TranscriptionResult {
  text: string;
  provider: string;
}

export const TranscribeView = () => {
  const [adagioResult, setAdagioResult] = useState<TranscriptionResult | null>(null);
  const [state, setState] = useState<TranscribeState>("idle");
  const [progress, setProgress] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [canTranscribe, setCanTranscribe] = useState(false);
  const [error, setError] = useState<TranscribeError | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  // Hook para cambiar de pestaña
  const [_, setSearchParams] = useSearchParams();

  // Accessibility: Focus management
  useEffect(() => {
    if (state === "completed") {
      const resultContainer = document.getElementById("transcription-result");
      if (resultContainer) {
        resultContainer.focus();
      }
    }
  }, [state]);

  const handleAudioReady = useCallback((blob: Blob, _metadata?: any) => {
    setAudioBlob(blob);
    setCanTranscribe(true);
    setError(null);
    setState("idle");
  }, []);

  const handleTranscribe = async () => {
    if (!audioBlob) return;

    setState("uploading");
    setProgress(10);
    setError(null);

    try {
      // 1. Prepare audio
      setProgress(30);

      // 2. Upload and Transcribe
      setState("transcribing");
      setProgress(50);

      const file = new File([audioBlob], "audio.wav", { type: audioBlob.type || "audio/wav" });
      const result = await transcribeService.transcribeFile(file);

      setAdagioResult({
        text: result.text,
        provider: result.provider || "adagio",
      });

      setProgress(100);
      setState("completed");

      toast({
        title: "Transcripción completada",
        description: "El audio ha sido procesado exitosamente.",
      });
    } catch (err) {
      console.error("Transcription error:", err);
      setError(err as TranscribeError);
      setState("error");
      toast({
        variant: "destructive",
        title: "Error en la transcripción",
        description: (err as Error).message || "Ha ocurrido un error inesperado.",
      });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado al portapapeles",
      description: "El texto ha sido copiado exitosamente.",
    });
  };

  const handleDownload = (text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "transcripcion-adagio.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRetry = () => {
    setState("idle");
    setError(null);
    setCanTranscribe(!!audioBlob);
  };

  const handleTTS = async (text: string) => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      const audio = await speakWithElevenLabs(text);

      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        toast({
          variant: "destructive",
          title: "Error de reproducción",
          description: "No se pudo reproducir el audio.",
        });
      };

      await audio.play();
    } catch (error) {
      console.error("TTS Error:", error);
      setIsPlaying(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al generar el audio.",
      });
    }
  };

  const isProcessing = state === "uploading" || state === "transcribing";
  const hasResults = state === "completed" && adagioResult;

  return (
    // AÑADIDO: 'relative' para que el overlay se posicione sobre este bloque
    <div className="w-full max-w-3xl mx-auto space-y-8 relative">
      {/* ------------------------------------------------------------------ */}
      {/* OVERLAY DE "COMING SOON" / MANTENIMIENTO */}
      {/* ------------------------------------------------------------------ */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 -m-4">
        {/* Fondo de cristal desenfocado que bloquea la interacción */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white/50" />

        {/* Tarjeta del mensaje */}
        <div className="relative bg-white border border-white shadow-2xl rounded-[2rem] p-8 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          {/* Icono Flotante */}
          <div className="mx-auto w-16 h-16 bg-[#005C64]/10 rounded-full flex items-center justify-center mb-2">
            <Sparkles className="w-8 h-8 text-[#005C64]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-[#0D0C1D] tracking-tight">Estamos trabajando en Adagio</h3>
            <p className="text-gray-500 leading-relaxed">
              Esta función saldrá muy pronto para todos. Mientras tanto, puedes ayudarnos a mejorar.
            </p>
          </div>

          {/* Botón de Acción: Redirige a la pestaña de entrenar */}
          <Button
            onClick={() => setSearchParams({ tab: "train" })}
            className="w-full bg-[#005C64] hover:bg-[#004a50] text-white rounded-full h-12 text-base font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group"
          >
            Ir a Entrenar Modelo
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
      {/* ------------------------------------------------------------------ */}

      {/* ENLACE DE ACCESIBILIDAD OCULTO VISUALMENTE (sr-only) */}
      <a
        href="#transcribe-controls"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
      >
        Saltar a controles de transcripción
      </a>

      {/* El resto de la interfaz se renderiza debajo (con efecto borroso por el overlay) */}
      {/* Añadimos 'pointer-events-none' y 'opacity-50' para asegurar que visualmente parezca inactivo debajo del cristal */}
      <div className="pointer-events-none opacity-50 filter blur-[2px] transition-all">
        <Tabs defaultValue="adagio" className="w-full">
          {/* PESTAÑAS ESTILIZADAS */}
          <div className="flex justify-center mb-8">
            <TabsList className="bg-black/5 p-1 rounded-full border border-white/10">
              <TabsTrigger
                value="adagio"
                className="rounded-full px-8 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-medium"
              >
                Transcripción Adagio
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="rounded-full px-8 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-medium"
              >
                ChatGPT vs Adagio
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="adagio"
            className="space-y-8 focus-visible:outline-none mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500"
          >
            <div className="relative">
              <RecorderUploader onAudioReady={handleAudioReady} disabled={isProcessing} />
            </div>

            {!isProcessing && !hasResults && audioBlob && (
              <div
                className="flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                id="transcribe-controls"
              >
                <Button
                  onClick={handleTranscribe}
                  disabled={!canTranscribe || !backendOnline}
                  size="xl"
                  className="min-w-[280px] h-14 rounded-full bg-[#005C64] hover:bg-[#004a50] text-white text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  aria-describedby="transcribe-button-description"
                >
                  <Mic className="mr-2 h-5 w-5" aria-hidden="true" />
                  Transcribir con Adagio
                </Button>
              </div>
            )}

            {!audioBlob && !hasResults && !error && state === "idle" && (
              <div className="opacity-70 scale-95 transform transition-all">
                <EmptyState
                  icon={FileAudio}
                  title="Entrada de Audio"
                  description="Graba tu voz o sube un archivo para comenzar"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
