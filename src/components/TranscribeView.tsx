import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { RecorderUploader } from "@/components/RecorderUploader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import ComparisonView from "@/components/ComparisonView";
import { FeedbackPrompt } from "@/components/FeedbackPrompt";
import { useAuth } from "@/contexts/AuthContext";
import { transcribeService, type TranscribeError } from "@/services/transcribe";
import { saveTranscription } from "@/services/transcriptionStore";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TranscribeState = "idle" | "uploading" | "transcribing" | "completed" | "error";

interface TranscriptionResult {
  text: string;
  provider: string;
}

export const TranscribeView = () => {
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [state, setState] = useState<TranscribeState>("idle");
  const [progress, setProgress] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [canTranscribe, setCanTranscribe] = useState(false);
  const [error, setError] = useState<TranscribeError | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (state === "completed") {
      document.getElementById("transcription-result")?.focus();
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
      setProgress(30);
      setState("transcribing");
      setProgress(50);

      const file = new File([audioBlob], "audio.wav", { type: audioBlob.type || "audio/wav" });
      const res = await transcribeService.transcribeFile(file);

      setResult({ text: res.text, provider: res.provider || "Adagio" });
      setProgress(100);
      setState("completed");

      // Guardar la transcripción (audio + texto) si el usuario está logueado
      try {
        const saved = await saveTranscription({
          provider: 'adagio',
          text: res.text,
          audioBlob,
        });
        setTranscriptionId(saved?.id ?? null);
      } catch (e) {
        console.warn('No se pudo guardar la transcripción:', e);
      }

      toast({ title: "Transcripción completada", description: "El audio ha sido procesado exitosamente." });
    } catch (err) {
      console.error("Transcription error:", err);
      setError(err as TranscribeError);
      setState("error");
      toast({ variant: "destructive", title: "Error en la transcripción", description: (err as Error).message || "Ha ocurrido un error inesperado." });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado al portapapeles", description: "El texto ha sido copiado exitosamente." });
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
      audio.onerror = () => { setIsPlaying(false); toast({ variant: "destructive", title: "Error de reproducción", description: "No se pudo reproducir el audio." }); };
      await audio.play();
    } catch (error) {
      console.error("TTS Error:", error);
      setIsPlaying(false);
      toast({ variant: "destructive", title: "Error", description: "Error al generar el audio." });
    }
  };

  const isProcessing = state === "uploading" || state === "transcribing";
  const hasResults = state === "completed" && result;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-8">
      <a href="#transcribe-controls" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground">
        Saltar a controles de transcripción
      </a>

      <div>
        <Tabs defaultValue="adagio" className="w-full">
          <div className="flex justify-center mb-6 md:mb-8">
            <TabsList className="bg-black/5 p-1 rounded-full border border-white/10 max-w-full">
              <TabsTrigger value="adagio" className="rounded-full px-3 sm:px-5 md:px-8 py-2 text-xs sm:text-sm md:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-medium whitespace-nowrap">
                <span className="sm:hidden">Adagio</span>
                <span className="hidden sm:inline">Transcripción Adagio</span>
              </TabsTrigger>
              <TabsTrigger value="comparison" className="rounded-full px-3 sm:px-5 md:px-8 py-2 text-xs sm:text-sm md:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-medium whitespace-nowrap">
                <span className="sm:hidden">Comparar</span>
                <span className="hidden sm:inline">ChatGPT vs Adagio</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="adagio" className="space-y-4 md:space-y-8 focus-visible:outline-none mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <div className="relative">
              <RecorderUploader onAudioReady={handleAudioReady} disabled={isProcessing} />
            </div>

            {isProcessing && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {state === "uploading" ? "Subiendo audio..." : "Transcribiendo con Adagio..."}
                </p>
                {state === "transcribing" && (
                  <p className="text-xs text-muted-foreground text-center">
                    La primera solicitud puede tardar 30-60s si el servidor está en cold start
                  </p>
                )}
              </div>
            )}

            {!isProcessing && !hasResults && audioBlob && (
              <div className="flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" id="transcribe-controls">
                <Button
                  onClick={handleTranscribe}
                  disabled={!canTranscribe}
                  size="xl"
                  className="min-w-[280px] h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  aria-describedby="transcribe-button-description"
                >
                  <Mic className="mr-2 h-5 w-5" aria-hidden="true" />
                  Transcribir con Adagio
                </Button>
              </div>
            )}

            {state === "error" && error && (
              <ErrorState title={error.message} description={error.details || "Ha ocurrido un error inesperado."} onRetry={handleRetry} />
            )}

            {hasResults && result && (
              <Card className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" id="transcription-result" tabIndex={-1}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                  <h3 className="font-semibold text-lg">Resultado</h3>
                  <Badge variant="secondary" className="ml-auto">{result.provider}</Badge>
                </div>
                <Textarea value={result.text} readOnly className="min-h-[120px] resize-y" aria-label="Texto transcrito" />

                <FeedbackPrompt
                  provider="adagio"
                  predictedText={result.text}
                  audioBlob={audioBlob}
                />

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(result.text)}>
                    <Copy className="mr-1 h-4 w-4" /> Copiar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(result.text)}>
                    <Download className="mr-1 h-4 w-4" /> Descargar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleTTS(result.text)} disabled={isPlaying}>
                    {isPlaying ? <Square className="mr-1 h-4 w-4" /> : <Volume2 className="mr-1 h-4 w-4" />}
                    {isPlaying ? "Reproduciendo..." : "Escuchar"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setState("idle"); setResult(null); setAudioBlob(null); setCanTranscribe(false); }}>
                    Transcribir otro audio
                  </Button>
                </div>
              </Card>
            )}

            {!audioBlob && !hasResults && !error && state === "idle" && (
              <div className="opacity-70 scale-95 transform transition-all">
                <EmptyState icon={FileAudio} title="Entrada de Audio" description="Graba tu voz o sube un archivo para comenzar" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="focus-visible:outline-none mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <ComparisonView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
