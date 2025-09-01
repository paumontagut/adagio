import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TranscriptionEvent {
  type: string;
  delta?: string;
  text?: string;
  error?: any;
  message?: string;
}

export const useRealtimeTranscribe = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const connect = useCallback(async () => {
    try {
      setError(null);
      
      // Get the current project URL dynamically
      const currentUrl = window.location.origin;
      const projectId = currentUrl.includes('lovable.dev') 
        ? currentUrl.split('.')[0].split('//')[1]
        : 'localhost:54321';
        
      const wsUrl = currentUrl.includes('lovable.dev')
        ? `wss://cydqkoohhzesogvctvhy.functions.supabase.co/functions/v1/openai-realtime-transcribe`
        : `ws://localhost:54321/functions/v1/openai-realtime-transcribe`;

      console.log('Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data: TranscriptionEvent = JSON.parse(event.data);
          console.log('WebSocket message:', data);

          switch (data.type) {
            case 'connection_established':
              console.log('Connection established');
              break;
              
            case 'session_ready':
              console.log('Session ready for audio input');
              break;
              
            case 'speech_started':
              setIsTranscribing(true);
              console.log('Speech detection started');
              break;
              
            case 'transcription_delta':
              if (data.text) {
                setTranscription(data.text);
              }
              break;
              
            case 'transcription_complete':
            case 'response_complete':
              if (data.text) {
                setTranscription(data.text);
              }
              setIsTranscribing(false);
              console.log('Transcription completed:', data.text);
              break;
              
            case 'error':
              console.error('WebSocket error:', data.error);
              setError(data.error?.message || 'Transcription error');
              setIsTranscribing(false);
              toast({
                title: "Error de transcripción",
                description: data.error?.message || 'Error desconocido',
                variant: "destructive"
              });
              break;
              
            case 'connection_closed':
              setIsConnected(false);
              setIsTranscribing(false);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Error de conexión WebSocket');
        setIsConnected(false);
        setIsTranscribing(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsTranscribing(false);
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setError('No se pudo conectar al servicio de transcripción');
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsTranscribing(false);
  }, []);

  const sendAudio = useCallback((audioData: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'audio_data',
        audio: audioData
      }));
    }
  }, []);

  const endAudio = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'end_audio'
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setTranscription('');
    setError(null);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'reset'
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isTranscribing,
    transcription,
    error,
    connect,
    disconnect,
    sendAudio,
    endAudio,
    reset
  };
};