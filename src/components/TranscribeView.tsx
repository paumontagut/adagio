import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card"; // Importamos CardContent si se usa
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { RecorderUploader } from "@/components/RecorderUploader";
import { BackendStatus } from "@/components/BackendStatus";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import ComparisonView from "@/components/ComparisonView";
import { sessionManager } from "@/lib/sessionManager";
import { transcribeService, type TranscribeError, type TranscribeProvider } from "@/services/transcribe";
import { speakWithElevenLabs } from "@/services/tts";
import type { ConversionResult } from "@/lib/audioConverter";
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
  Square,
  Mic,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  // Accessibility: Focus management
  useEffect(() => {
    if (state === "completed") {
      const resultContainer = document.getElementById("transcription-result");
      if (resultContainer) {
        resultContainer.focus();
      }
    }
  }, [state]);

  const handleAudioReady = useCallback((blob: Blob) => {
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

      const session = await sessionManager.createSession();
      const result = await transcribeService.transcribe(audioBlob, session.id, "adagio");

      setAdagioResult({
        text: result.text,
        provider: "adagio",
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
      const audioData = await speakWithElevenLabs(text);
      const audio = new Audio(URL.createObjectURL(new Blob([audioData])));

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
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* ENLACE DE ACCESIBILIDAD OCULTO VISUALMENTE (sr-only) */}
      <a
        href="#transcribe-controls"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
      >
        Saltar a controles de transcripción
      </a>

      <Tabs defaultValue="adagio" className="w-full">
        {/* PESTAÑAS ESTILIZADAS: Fondo sutil y redondeado */}
        <div className="flex justify-center mb-8">
          <TabsList className="bg-black/5 p-1 rounded-full border border-white/10">
            <TabsTrigger
              value="adagio"
              className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Transcripción Adagio</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="comparison"
              className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4" />
                <span>ChatGPT vs Adagio</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="adagio" className="space-y-8 focus-visible:outline-none">
          {/* Área de Grabación: Sin Card wrapper para que se integre en el cristal */}
          <div className="relative">
            <RecorderUploader onAudioReady={handleAudioReady} isProcessing={isProcessing} />
          </div>

          {/* Progreso */}
          {isProcessing && (
            <div className="space-y-4 animate-in fade-in-50 duration-500 bg-white/40 p-6 rounded-3xl border border-white/20 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm font-medium text-[#005C64]">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {state === "uploading" ? "Subiendo audio..." : "Transcribiendo con IA..."}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-[#005C64]/20" />
            </div>
          )}

          {/* Error */}
          {error && (
            <ErrorState
              title="Error en la transcripción"
              description="Verifica tu conexión y los datos del audio e inténtalo de nuevo."
              onRetry={handleRetry}
            />
          )}

          {/* BOTÓN DE TRANSCRIBIR (CAMBIADO A VERDE ADAGIO #005C64) */}
          {!isProcessing && !hasResults && audioBlob && (
            <div
              className="flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
              id="transcribe-controls"
            >
              <Button
                onClick={handleTranscribe}
                disabled={!canTranscribe || !backendOnline}
                size="xl"
                // Estilo personalizado: Verde Adagio, Sombra, Efecto Hover
                className="min-w-[280px] h-14 rounded-full bg-[#005C64] hover:bg-[#004a50] text-white text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                aria-describedby="transcribe-button-description"
              >
                <Mic className="mr-2 h-5 w-5" aria-hidden="true" />
                Transcribir con Adagio
              </Button>

              <div id="transcribe-button-description" className="sr-only">
                Iniciar transcripción con Adagio
              </div>

              {!backendOnline && (
                <p
                  className="text-sm text-red-500/80 mt-2 text-center font-medium bg-red-50 px-3 py-1 rounded-full"
                  role="status"
                >
                  ⚠️ Esperando conexión al servidor...
                </p>
              )}
            </div>
          )}

          {/* Estado Vacío (Placeholder) */}
          {!audioBlob && !hasResults && !error && state === "idle" && (
            <div className="opacity-70 scale-95 transform transition-all">
              <EmptyState
                icon={FileAudio}
                title="Entrada de Audio"
                description="Graba tu voz o sube un archivo para comenzar"
              />
            </div>
          )}

          {/* Resultados de Transcripción */}
          {hasResults && (
            <Card className="border-0 shadow-none bg-white/40 backdrop-blur-sm overflow-hidden rounded-3xl animate-in fade-in-50 slide-in-from-bottom-8 duration-700">
              <div className="border-b border-black/5 bg-white/20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-[#005C64]/10 text-[#005C64] hover:bg-[#005C64]/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completado
                  </Badge>
                  <span className="text-sm text-muted-foreground">Modelo Adagio v1</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTTS(adagioResult.text)}
                    disabled={isPlaying}
                    className="rounded-full hover:bg-white/50"
                  >
                    {isPlaying ? (
                      <Square className="h-4 w-4 text-[#005C64]" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-[#005C64]" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(adagioResult.text)}
                    className="rounded-full hover:bg-white/50"
                  >
                    <Copy className="h-4 w-4 text-[#005C64]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(adagioResult.text)}
                    className="rounded-full hover:bg-white/50"
                  >
                    <Download className="h-4 w-4 text-[#005C64]" />
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <Textarea
                  readOnly
                  value={adagioResult.text}
                  className="min-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 text-lg leading-relaxed text-[#0D0C1D]"
                />
              </div>
            </Card>
          )}

          {/* Estado del Backend (Discreto abajo) */}
          <div className="flex justify-center opacity-50 hover:opacity-100 transition-opacity">
            <BackendStatus onStatusChange={setBackendOnline} autoRefresh={true} />
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <ComparisonView />
        </TabsContent>
      </Tabs>
    </div>
  );
};
