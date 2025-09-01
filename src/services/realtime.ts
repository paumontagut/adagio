import { supabase } from "@/integrations/supabase/client";

export interface RealtimeResult {
  text: string;
  ttfb?: number; // Time to first byte (first delta)
  totalMs: number;
}

export interface RealtimeCallbacks {
  onPartial: (text: string, ttfb?: number) => void;
  onFinal: (result: RealtimeResult) => void;
  onError: (error: string) => void;
}

export interface EphemeralToken {
  client_secret: {
    value: string;
    expires_at: string;
  };
  id: string;
  expires_at?: string;
}

export class RealtimeTranscriber {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private callbacks: RealtimeCallbacks;
  private startTime: number = 0;
  private firstDeltaTime?: number;
  private accumulatedText: string = '';
  private isCompleted: boolean = false;
  private sessionReady: boolean = false;
  private audioSource: File | 'microphone' | null = null;

  constructor(callbacks: RealtimeCallbacks) {
    this.callbacks = callbacks;
  }

  async getEphemeralToken(): Promise<EphemeralToken> {
    console.log('Requesting ephemeral token...');
    
    const { data, error } = await supabase.functions.invoke('realtime-ephemeral', {
      body: {}
    });

    if (error) {
      console.error('Error getting ephemeral token:', error);
      throw new Error(`Failed to get ephemeral token: ${error.message}`);
    }

    if (!data?.client_secret?.value) {
      console.error('Invalid token response:', data);
      throw new Error('Invalid ephemeral token response');
    }

    console.log('Ephemeral token obtained successfully');
    return data as EphemeralToken;
  }

  async startTranscription(audioSource: File | 'microphone'): Promise<void> {
    try {
      this.startTime = performance.now();
      this.accumulatedText = '';
      this.firstDeltaTime = undefined;
      this.isCompleted = false;
      this.sessionReady = false;
      this.audioSource = audioSource;

      // Get ephemeral token
      const tokenData = await this.getEphemeralToken();
      const ephemeralToken = tokenData.client_secret.value;

      console.log('Starting WebRTC connection...');

      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up audio element for playback
      this.audioEl = document.createElement("audio");
      this.audioEl.autoplay = true;

      // Handle remote audio track
      this.pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        if (this.audioEl && event.streams[0]) {
          this.audioEl.srcObject = event.streams[0];
        }
      };

      // Add local audio track
      if (audioSource === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 24000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        stream.getTracks().forEach(track => {
          if (this.pc) {
            this.pc.addTrack(track, stream);
          }
        });
      } else {
        // For file sources, add a recvonly audio transceiver to ensure SDP has audio section
        this.pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      // Create data channel
      this.dc = this.pc.createDataChannel("oai-events");
      
      this.dc.addEventListener("open", () => {
        console.log('Data channel opened');
        // Wait for session.created before sending session.update
      });

      this.dc.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message.type, message);
          
          this.handleRealtimeMessage(message);
        } catch (error) {
          console.error('Error parsing WebRTC message:', error);
        }
      });

      this.dc.addEventListener("error", (event) => {
        console.error('Data channel error:', event);
        this.callbacks.onError('Data channel error');
      });

      // Create offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      console.log('Connecting to OpenAI Realtime API...');

      // Connect to OpenAI Realtime API with simple retry
      let answerSdp: string | null = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${ephemeralToken}`,
              "Content-Type": "application/sdp",
              "OpenAI-Beta": "realtime=v1"
            },
            body: offer.sdp,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI Realtime API error: ${response.status} ${errorText}`);
          }

          answerSdp = await response.text();
          break; // success
        } catch (err) {
          console.error(`Realtime SDP fetch attempt ${attempt} failed:`, err);
          if (attempt === 2) throw err;
          await new Promise((r) => setTimeout(r, 700));
        }
      }

      console.log('Received answer SDP, setting remote description...');

      await this.pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp as string,
      });

      console.log('WebRTC connection established successfully');

    } catch (error) {
      console.error('Error in startTranscription:', error);
      this.callbacks.onError(error instanceof Error ? error.message : String(error));
      this.cleanup();
    }
  }

  private async processAudioFile(file: File): Promise<void> {
    try {
      console.log('Processing audio file:', file.name, file.size, 'bytes');
      
      // Convert file to PCM16 audio at 24kHz
      const audioBuffer = await this.convertToPCM16(file);
      
      // Send audio in chunks
      const chunkSize = 4096; // Send in 4KB chunks
      for (let i = 0; i < audioBuffer.byteLength; i += chunkSize) {
        const chunk = audioBuffer.slice(i, i + chunkSize);
        const base64Audio = this.arrayBufferToBase64(chunk);
        
        const audioEvent = {
          type: 'input_audio_buffer.append',
          audio: base64Audio
        };
        
        if (this.dc && this.dc.readyState === 'open') {
          this.dc.send(JSON.stringify(audioEvent));
        }
        
        // Add small delay between chunks to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Commit the audio buffer and request response
      if (this.dc && this.dc.readyState === 'open') {
        this.dc.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
        this.dc.send(JSON.stringify({ type: 'response.create' }));
      }
      
      console.log('Audio file processing completed');
      
    } catch (error) {
      console.error('Error processing audio file:', error);
      this.callbacks.onError('Error processing audio file: ' + error);
    }
  }

  private async convertToPCM16(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Create audio context for conversion
          const audioContext = new AudioContext({ sampleRate: 24000 });
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Convert to PCM16 mono at 24kHz
          const channelData = audioBuffer.getChannelData(0); // Get mono channel
          const pcm16 = new Int16Array(channelData.length);
          
          for (let i = 0; i < channelData.length; i++) {
            // Convert float32 to int16
            const s = Math.max(-1, Math.min(1, channelData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          resolve(pcm16.buffer);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  private handleRealtimeMessage(message: any): void {
    switch (message.type) {
      case 'session.created':
        console.log('Session created successfully');
        this.sessionReady = true;
        
        // Now send session.update after session is created
        const sessionUpdate = {
          type: 'session.update',
          session: {
            modalities: ["text"],
            instructions: "Eres un servicio de transcripción. Solo transcribe lo que escuches. No respondas ni converses.",
            input_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000,
              create_response: true, // auto-crear respuesta al detectar fin de habla
              interrupt_response: true
            }
          }
        };
        
        this.dc?.send(JSON.stringify(sessionUpdate));
        break;
        
      case 'session.updated':
        console.log('Session updated successfully');
        
        // Now process file if we have one and session is ready
        if (this.sessionReady && this.audioSource instanceof File) {
          this.processAudioFile(this.audioSource);
        }
        break;
        
      case 'response.audio_transcript.delta':
      case 'response.output_text.delta':
        // Partial transcription (handle both types)
        if (message.delta) {
          if (!this.firstDeltaTime) {
            this.firstDeltaTime = performance.now();
            const ttfb = this.firstDeltaTime - this.startTime;
            console.log('First delta received, TTFB:', ttfb, 'ms');
          }
          
          this.accumulatedText += message.delta;
          
          const ttfb = this.firstDeltaTime ? this.firstDeltaTime - this.startTime : undefined;
          this.callbacks.onPartial(this.accumulatedText, ttfb);
        }
        break;
        
      case 'response.audio_transcript.done':
      case 'response.output_text.done':
        // Final transcription
        console.log('Transcription completed');
        this.completeTranscription();
        break;
        
      case 'response.output_item.added':
        // Sometimes items are created without deltas; we wait for 'done' to get full text
        break;
      
      case 'response.output_item.done':
        // Finalized assistant message may include text content here
        try {
          const contents = message.item?.content || [];
          for (const c of contents) {
            if (c?.type === 'text' && typeof c.text === 'string') {
              if (!this.firstDeltaTime) {
                this.firstDeltaTime = performance.now();
              }
              this.accumulatedText += c.text;
            }
          }
          const ttfb = this.firstDeltaTime ? this.firstDeltaTime - this.startTime : undefined;
          this.callbacks.onPartial(this.accumulatedText, ttfb);
        } catch (e) {
          console.warn('Failed to parse output_item.done content', e);
        }
        break;
      
      case 'response.done':
        // Response completed - ensure we extract text if deltas didn't arrive
        try {
          if (!this.accumulatedText && message.response?.output?.length) {
            for (const item of message.response.output) {
              const contents = item?.content || [];
              for (const c of contents) {
                if (c?.type === 'text' && typeof c.text === 'string') {
                  this.accumulatedText += c.text;
                }
                if (c?.type === 'output_text' && typeof c.text === 'string') {
                  this.accumulatedText += c.text;
                }
              }
            }
          }
        } catch (e) {
          console.warn('Failed to parse response.done output text', e);
        }
        console.log('Response completed');
        if (!this.isCompleted) {
          this.completeTranscription();
        }
        break;
        
      case 'error':
        console.error('Realtime API error:', message);
        this.callbacks.onError(message.error?.message || 'Unknown realtime error');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        // When VAD detects end of speech, ensure a response is created (mic mode)
        if (this.audioSource === 'microphone' && this.dc?.readyState === 'open') {
          console.log('Speech stopped detected, forcing response.create');
          this.dc.send(JSON.stringify({ type: 'response.create' }));
        }
        break;
      
      default:
        console.log('Unhandled message type:', message.type);
    }
  }

  private completeTranscription(): void {
    if (this.isCompleted) return;
    
    this.isCompleted = true;
    const totalMs = performance.now() - this.startTime;
    const ttfb = this.firstDeltaTime ? this.firstDeltaTime - this.startTime : undefined;
    
    const result: RealtimeResult = {
      text: this.accumulatedText || 'No transcription received',
      ttfb,
      totalMs
    };
    
    console.log('Final transcription result:', result);
    this.callbacks.onFinal(result);
    
    // Cleanup after a delay to allow final messages
    setTimeout(() => {
      this.cleanup();
    }, 1000);
  }

  private cleanup(): void {
    console.log('Cleaning up realtime transcriber...');
    
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    
    if (this.audioEl) {
      this.audioEl.srcObject = null;
      this.audioEl = null;
    }
  }

  public stop(): void {
    console.log('Stopping realtime transcription...');
    this.cleanup();
  }
}

export async function startRealtimeTranscription(
  source: File | 'microphone',
  callbacks: RealtimeCallbacks
): Promise<RealtimeTranscriber> {
  const transcriber = new RealtimeTranscriber(callbacks);
  await transcriber.startTranscription(source);
  return transcriber;
}