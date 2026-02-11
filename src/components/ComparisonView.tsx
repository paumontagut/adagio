import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Download, AlertCircle, CheckCircle2, Clock, Zap, Volume2, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RecorderUploader } from '@/components/RecorderUploader';
import { transcribeAdagio, type AdagioResult } from '@/services/adagio';
import { speakWithElevenLabs } from '@/services/tts';
import { supabase } from '@/integrations/supabase/client';

interface ChatGPTResult {
  text: string;
  totalMs: number;
}

interface ComparisonState {
  isProcessing: boolean;
  audioFile?: File;
  audioMetadata?: {
    duration: number;
    size: number;
    format: string;
  };
  adagio: {
    status: 'idle' | 'processing' | 'completed' | 'error';
    result?: AdagioResult;
    error?: string;
  };
  chatgpt: {
    status: 'idle' | 'processing' | 'completed' | 'error';
    result?: ChatGPTResult;
    error?: string;
  };
}

const ComparisonView: React.FC = () => {
  const { toast } = useToast();
  const [state, setState] = useState<ComparisonState>({
    isProcessing: false,
    adagio: { status: 'idle' },
    chatgpt: { status: 'idle' }
  });
  
  // TTS states
  const [isLoadingTTSAdagio, setIsLoadingTTSAdagio] = useState(false);
  const [isLoadingTTSChatGPT, setIsLoadingTTSChatGPT] = useState(false);
  const [audioPlayerAdagio, setAudioPlayerAdagio] = useState<HTMLAudioElement | null>(null);
  const [audioPlayerChatGPT, setAudioPlayerChatGPT] = useState<HTMLAudioElement | null>(null);

  const handleAudioReady = useCallback((audioBlob: Blob, metadata: any) => {
    console.log('Audio ready for comparison:', metadata);
    
    const file = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
    
    setState(prev => ({
      ...prev,
      audioFile: file,
      audioMetadata: {
        duration: metadata.duration || 0,
        size: file.size,
        format: file.type
      }
    }));
  }, []);

  const transcribeChatGPT = async (file: File): Promise<ChatGPTResult> => {
    const start = performance.now();
    
    const formData = new FormData();
    formData.append('file', file, file.name);

    const { data, error } = await supabase.functions.invoke('stt-openai', {
      body: formData,
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);

    const totalMs = performance.now() - start;
    return { text: data?.text ?? '', totalMs };
  };

  const startComparison = useCallback(async () => {
    if (!state.audioFile) {
      toast({
        title: "Error",
        description: "No hay archivo de audio para procesar",
        variant: "destructive"
      });
      return;
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      adagio: { status: 'processing' },
      chatgpt: { status: 'processing' }
    }));

    const adagioPromise = transcribeAdagio(state.audioFile)
      .then(result => {
        setState(prev => ({ ...prev, adagio: { status: 'completed', result } }));
      })
      .catch(error => {
        setState(prev => ({ ...prev, adagio: { status: 'error', error: error.message } }));
      });

    const chatgptPromise = transcribeChatGPT(state.audioFile)
      .then(result => {
        setState(prev => ({ ...prev, chatgpt: { status: 'completed', result } }));
      })
      .catch(error => {
        setState(prev => ({ ...prev, chatgpt: { status: 'error', error: error.message } }));
      });

    Promise.allSettled([adagioPromise, chatgptPromise]).finally(() => {
      setState(prev => ({ ...prev, isProcessing: false }));
    });

  }, [state.audioFile, toast]);

  const copyToClipboard = useCallback((text: string, provider: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado",
        description: `Texto de ${provider} copiado al portapapeles`,
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive"
      });
    });
  }, [toast]);

  const downloadTranscription = useCallback((text: string, provider: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${provider.toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Descargado",
      description: `Transcripción de ${provider} descargada`,
    });
  }, [toast]);

  const resetComparison = useCallback(() => {
    // Stop any playing audio
    if (audioPlayerAdagio) {
      audioPlayerAdagio.pause();
      audioPlayerAdagio.currentTime = 0;
      setAudioPlayerAdagio(null);
    }
    if (audioPlayerChatGPT) {
      audioPlayerChatGPT.pause();
      audioPlayerChatGPT.currentTime = 0;
      setAudioPlayerChatGPT(null);
    }
    
    setIsLoadingTTSAdagio(false);
    setIsLoadingTTSChatGPT(false);
    
    setState({
      isProcessing: false,
      adagio: { status: 'idle' },
      chatgpt: { status: 'idle' }
    });
  }, [audioPlayerAdagio, audioPlayerChatGPT]);

  const handleSpeakAdagio = async () => {
    if (!state.adagio.result?.text?.trim()) return;
    
    setIsLoadingTTSAdagio(true);
    try {
      const audio = await speakWithElevenLabs(state.adagio.result.text);
      setAudioPlayerAdagio(audio);
      
      audio.onended = () => setAudioPlayerAdagio(null);
      audio.onerror = () => {
        setAudioPlayerAdagio(null);
        toast({
          title: "Error de audio",
          description: "No se pudo reproducir el audio generado",
          variant: "destructive"
        });
      };
      
      await audio.play();
      
      toast({
        title: "Reproduciendo",
        description: "Audio de Adagio generado con ElevenLabs"
      });
      
    } catch (error) {
      console.error('TTS error:', error);
      toast({
        title: "Error de síntesis de voz",
        description: "No se pudo generar el audio",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTTSAdagio(false);
    }
  };

  const handleStopAdagio = () => {
    if (audioPlayerAdagio) {
      audioPlayerAdagio.pause();
      audioPlayerAdagio.currentTime = 0;
      setAudioPlayerAdagio(null);
    }
  };

  const handleSpeakChatGPT = async () => {
    if (!state.chatgpt.result?.text?.trim()) return;
    
    setIsLoadingTTSChatGPT(true);
    try {
      const audio = await speakWithElevenLabs(state.chatgpt.result.text);
      setAudioPlayerChatGPT(audio);
      
      audio.onended = () => setAudioPlayerChatGPT(null);
      audio.onerror = () => {
        setAudioPlayerChatGPT(null);
        toast({
          title: "Error de audio",
          description: "No se pudo reproducir el audio generado",
          variant: "destructive"
        });
      };
      
      await audio.play();
      
      toast({
        title: "Reproduciendo",
        description: "Audio de ChatGPT generado con ElevenLabs"
      });
      
    } catch (error) {
      console.error('TTS error:', error);
      toast({
        title: "Error de síntesis de voz",
        description: "No se pudo generar el audio",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTTSChatGPT(false);
    }
  };

  const handleStopChatGPT = () => {
    if (audioPlayerChatGPT) {
      audioPlayerChatGPT.pause();
      audioPlayerChatGPT.currentTime = 0;
      setAudioPlayerChatGPT(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const formatTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Comparativa de Transcripción</h2>
        <p className="text-muted-foreground">
          Compara los resultados de Adagio vs ChatGPT 4o Transcribe
        </p>
      </div>

      {/* Audio Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Entrada de Audio
          </CardTitle>
          <CardDescription>
            Graba o sube un archivo de audio para comparar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RecorderUploader
            onAudioReady={handleAudioReady}
            disabled={state.isProcessing}
          />

          {state.audioMetadata && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-muted rounded-lg text-sm">
              <div className="text-center">
                <span className="text-muted-foreground">Duración</span>
                <p className="font-mono">{state.audioMetadata.duration.toFixed(1)}s</p>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground">Tamaño</span>
                <p className="font-mono">{(state.audioMetadata.size / 1024).toFixed(0)} KB</p>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground">Formato</span>
                <p className="font-mono">{state.audioMetadata.format}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={startComparison}
              disabled={!state.audioFile || state.isProcessing}
              className="flex-1"
            >
              {state.isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Comparando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Comparar
                </>
              )}
            </Button>
            {(state.adagio.status !== 'idle' || state.chatgpt.status !== 'idle') && (
              <Button variant="outline" onClick={resetComparison} disabled={state.isProcessing}>
                Nueva comparación
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Adagio Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(state.adagio.status)}
                Adagio
              </span>
              <Badge variant="outline">Local</Badge>
            </CardTitle>
            <CardDescription>
              Transcripción usando servidor Adagio local
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(state.adagio.status === 'completed' || state.adagio.result) && (
              <div className="grid grid-cols-1 gap-2 p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Tiempo Total:</span>
                  <span className="font-mono">{formatTime(state.adagio.result?.ms)}</span>
                </div>
              </div>
            )}

            {state.adagio.status === 'processing' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin" />
                Procesando...
              </div>
            )}

            {state.adagio.status === 'error' && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Error
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  {state.adagio.error}
                </p>
              </div>
            )}

            {state.adagio.status === 'completed' && state.adagio.result && (
              <>
                <div className="p-3 bg-background border rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {state.adagio.result.text || 'Sin transcripción'}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(state.adagio.result!.text, 'Adagio')}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadTranscription(state.adagio.result!.text, 'Adagio')}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                  {audioPlayerAdagio ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStopAdagio}
                      title="Detener reproducción"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSpeakAdagio}
                      disabled={isLoadingTTSAdagio || !state.adagio.result?.text?.trim()}
                      title="Reproducir con ElevenLabs"
                    >
                      {isLoadingTTSAdagio ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ChatGPT Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(state.chatgpt.status)}
                ChatGPT 4o Transcribe
              </span>
              <Badge variant="outline">API</Badge>
            </CardTitle>
            <CardDescription>
              Transcripción usando OpenAI gpt-4o-mini-transcribe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metrics */}
            {(state.chatgpt.status === 'completed' || state.chatgpt.result) && (
              <div className="grid grid-cols-1 gap-2 p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Tiempo Total:</span>
                  <span className="font-mono">{formatTime(state.chatgpt.result?.totalMs)}</span>
                </div>
              </div>
            )}

            {/* Content */}
            {state.chatgpt.status === 'processing' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin" />
                Procesando...
              </div>
            )}

            {state.chatgpt.status === 'error' && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Error
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  {state.chatgpt.error}
                </p>
              </div>
            )}

            {state.chatgpt.status === 'completed' && state.chatgpt.result && (
              <>
                <div className="p-3 bg-background border rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {state.chatgpt.result.text || 'Sin transcripción'}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(state.chatgpt.result!.text, 'ChatGPT')}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadTranscription(state.chatgpt.result!.text, 'ChatGPT')}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                  {audioPlayerChatGPT ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStopChatGPT}
                      title="Detener reproducción"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSpeakChatGPT}
                      disabled={isLoadingTTSChatGPT || !state.chatgpt.result?.text?.trim()}
                      title="Reproducir con ElevenLabs"
                    >
                      {isLoadingTTSChatGPT ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Summary */}
      {state.adagio.status === 'completed' && state.chatgpt.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Comparación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tiempo Total</p>
                <p className="text-lg font-semibold">
                  Adagio: {formatTime(state.adagio.result?.ms)}
                </p>
                <p className="text-sm text-muted-foreground">
                  vs ChatGPT: {formatTime(state.chatgpt.result?.totalMs)}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Longitud</p>
                <p className="text-lg font-semibold">
                  Adagio: {state.adagio.result?.text.length} chars
                </p>
                <p className="text-sm text-muted-foreground">
                  vs ChatGPT: {state.chatgpt.result?.text.length} chars
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComparisonView;