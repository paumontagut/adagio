import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Download, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RecorderUploader } from '@/components/RecorderUploader';
import { transcribeAdagio, type AdagioResult } from '@/services/adagio';
import { startRealtimeTranscription, type RealtimeResult, type RealtimeCallbacks } from '@/services/realtime';

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
  realtime: {
    status: 'idle' | 'processing' | 'completed' | 'error';
    partialText: string;
    result?: RealtimeResult;
    error?: string;
    ttfb?: number;
  };
}

const ComparisonView: React.FC = () => {
  const { toast } = useToast();
  const [state, setState] = useState<ComparisonState>({
    isProcessing: false,
    adagio: { status: 'idle' },
    realtime: { status: 'idle', partialText: '' }
  });

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
      realtime: { status: 'processing', partialText: '' }
    }));

    // Start Adagio transcription
    const adagioPromise = transcribeAdagio(state.audioFile)
      .then(result => {
        setState(prev => ({
          ...prev,
          adagio: { status: 'completed', result }
        }));
        console.log('Adagio completed:', result);
      })
      .catch(error => {
        setState(prev => ({
          ...prev,
          adagio: { status: 'error', error: error.message }
        }));
        console.error('Adagio error:', error);
      });

    // Start Realtime transcription
    const realtimeCallbacks: RealtimeCallbacks = {
      onPartial: (text: string, ttfb?: number) => {
        setState(prev => ({
          ...prev,
          realtime: {
            ...prev.realtime,
            partialText: text,
            ttfb
          }
        }));
      },
      onFinal: (result: RealtimeResult) => {
        setState(prev => ({
          ...prev,
          realtime: {
            ...prev.realtime,
            status: 'completed',
            result,
            ttfb: prev.realtime.ttfb || result.ttfb
          }
        }));
        console.log('Realtime completed:', result);
      },
      onError: (error: string) => {
        setState(prev => ({
          ...prev,
          realtime: {
            ...prev.realtime,
            status: 'error',
            error
          }
        }));
        console.error('Realtime error:', error);
      }
    };

    const realtimePromise = startRealtimeTranscription(state.audioFile, realtimeCallbacks)
      .catch(error => {
        setState(prev => ({
          ...prev,
          realtime: {
            ...prev.realtime,
            status: 'error',
            error: error.message
          }
        }));
        console.error('Realtime setup error:', error);
      });

    // Wait for both to complete or error
    Promise.allSettled([adagioPromise, realtimePromise]).finally(() => {
      setState(prev => ({
        ...prev,
        isProcessing: false
      }));
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
    setState({
      isProcessing: false,
      adagio: { status: 'idle' },
      realtime: { status: 'idle', partialText: '' }
    });
  }, []);

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
          Compara los resultados de Adagio vs ChatGPT 4o Transcribe en tiempo real
        </p>
      </div>

      {/* Audio Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Audio de Entrada
          </CardTitle>
          <CardDescription>
            Graba o sube un archivo para comparar las transcripciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RecorderUploader
            onAudioReady={handleAudioReady}
            disabled={state.isProcessing}
          />
          
          {state.audioMetadata && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Duración: {formatTime(state.audioMetadata.duration * 1000)}</span>
              <span>Tamaño: {(state.audioMetadata.size / 1024).toFixed(1)} KB</span>
              <span>Formato: {state.audioMetadata.format}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={startComparison}
              disabled={!state.audioFile || state.isProcessing}
              className="flex-1"
            >
              {state.isProcessing ? 'Procesando...' : 'Iniciar Comparación'}
            </Button>
            
            <Button 
              onClick={resetComparison}
              variant="outline"
              disabled={state.isProcessing}
            >
              Reiniciar
            </Button>
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
                Adagio (Servidor)
              </span>
              <Badge variant="outline">Batch</Badge>
            </CardTitle>
            <CardDescription>
              Transcripción por lotes usando tu servidor FastAPI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metrics */}
            {(state.adagio.status === 'completed' || state.adagio.result) && (
              <div className="grid grid-cols-1 gap-2 p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Tiempo Total:</span>
                  <span className="font-mono">{formatTime(state.adagio.result?.ms)}</span>
                </div>
              </div>
            )}

            {/* Content */}
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
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Realtime Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(state.realtime.status)}
                ChatGPT 4o Transcribe
              </span>
              <Badge variant="outline">Realtime</Badge>
            </CardTitle>
            <CardDescription>
              Transcripción en tiempo real usando OpenAI Realtime API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metrics */}
            {(state.realtime.status === 'completed' || state.realtime.result || state.realtime.ttfb) && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>TTFB:</span>
                  <span className="font-mono">{formatTime(state.realtime.ttfb)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total:</span>
                  <span className="font-mono">{formatTime(state.realtime.result?.totalMs)}</span>
                </div>
              </div>
            )}

            {/* Content */}
            {state.realtime.status === 'processing' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 animate-spin" />
                  {state.realtime.partialText ? 'Transcribiendo...' : 'Conectando...'}
                </div>
                
                {state.realtime.partialText && (
                  <div className="p-3 bg-background border rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {state.realtime.partialText}
                      <span className="animate-pulse">|</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {state.realtime.status === 'error' && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Error
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  {state.realtime.error}
                </p>
              </div>
            )}

            {state.realtime.status === 'completed' && state.realtime.result && (
              <>
                <div className="p-3 bg-background border rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {state.realtime.result.text || 'Sin transcripción'}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(state.realtime.result!.text, 'ChatGPT')}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadTranscription(state.realtime.result!.text, 'ChatGPT')}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Summary */}
      {state.adagio.status === 'completed' && state.realtime.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Comparación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Velocidad (TTFB)</p>
                <p className="text-lg font-semibold">
                  ChatGPT: {formatTime(state.realtime.ttfb)}
                </p>
                <p className="text-sm text-muted-foreground">vs Adagio: Batch</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tiempo Total</p>
                <p className="text-lg font-semibold">
                  Adagio: {formatTime(state.adagio.result?.ms)}
                </p>
                <p className="text-sm text-muted-foreground">
                  vs ChatGPT: {formatTime(state.realtime.result?.totalMs)}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Longitud</p>
                <p className="text-lg font-semibold">
                  Adagio: {state.adagio.result?.text.length} chars
                </p>
                <p className="text-sm text-muted-foreground">
                  vs ChatGPT: {state.realtime.result?.text.length} chars
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