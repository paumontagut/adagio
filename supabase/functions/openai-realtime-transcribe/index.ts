import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  console.log("Starting WebSocket connection to OpenAI Realtime API");

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;
  let fullTranscription = '';
  let sessionReady = false;

  // Function to encode audio data for OpenAI API (PCM16 at 24kHz)
  const encodeAudioForAPI = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  };

  socket.onopen = () => {
    console.log("Client WebSocket connected");
    
    // Connect to OpenAI Realtime API
    const openAIUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
    openAISocket = new WebSocket(openAIUrl, [], {
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    openAISocket.onopen = () => {
      console.log("Connected to OpenAI Realtime API");
      socket.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to OpenAI Realtime API'
      }));
    };

    openAISocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("OpenAI message:", data.type);

        if (data.type === 'session.created') {
          console.log("Session created, sending session.update");
          // Send session configuration after receiving session.created
          const sessionUpdate = {
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: "You are a Spanish transcription assistant. Transcribe the provided audio accurately in Spanish.",
              voice: "alloy",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              input_audio_transcription: {
                model: "gpt-4o-transcribe"
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              temperature: 0.8,
              max_response_output_tokens: "inf"
            }
          };
          
          openAISocket?.send(JSON.stringify(sessionUpdate));
        }

        if (data.type === 'session.updated') {
          console.log("Session updated successfully");
          sessionReady = true;
          socket.send(JSON.stringify({
            type: 'session_ready',
            message: 'Ready to receive audio'
          }));
        }

        if (data.type === 'input_audio_buffer.speech_started') {
          console.log("Speech detected");
          socket.send(JSON.stringify({
            type: 'speech_started',
            message: 'Speech detected'
          }));
        }

        if (data.type === 'input_audio_buffer.speech_stopped') {
          console.log("Speech stopped, creating response");
          // Request transcription when speech stops
          openAISocket?.send(JSON.stringify({
            type: 'response.create',
            response: {
              modalities: ["text"],
              instructions: "Please transcribe the audio input into Spanish text."
            }
          }));
        }

        if (data.type === 'response.audio_transcript.delta') {
          fullTranscription += data.delta;
          socket.send(JSON.stringify({
            type: 'transcription_delta',
            delta: data.delta,
            text: fullTranscription
          }));
        }

        if (data.type === 'response.audio_transcript.done') {
          console.log("Transcription completed:", fullTranscription);
          socket.send(JSON.stringify({
            type: 'transcription_complete',
            text: fullTranscription
          }));
        }

        if (data.type === 'response.done') {
          console.log("Response completed");
          socket.send(JSON.stringify({
            type: 'response_complete',
            text: fullTranscription
          }));
        }

        if (data.type === 'error') {
          console.error("OpenAI Error:", data);
          socket.send(JSON.stringify({
            type: 'error',
            error: data.error
          }));
        }

      } catch (error) {
        console.error("Error parsing OpenAI message:", error);
      }
    };

    openAISocket.onerror = (error) => {
      console.error("OpenAI WebSocket error:", error);
      socket.send(JSON.stringify({
        type: 'error',
        error: 'OpenAI connection error'
      }));
    };

    openAISocket.onclose = () => {
      console.log("OpenAI WebSocket closed");
      socket.send(JSON.stringify({
        type: 'connection_closed',
        message: 'OpenAI connection closed'
      }));
    };
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log("Client message:", message.type);

      if (message.type === 'audio_data' && sessionReady) {
        // Convert base64 to Float32Array
        const binaryString = atob(message.audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Convert bytes to Float32Array (assuming PCM16)
        const float32Array = new Float32Array(bytes.length / 2);
        const dataView = new DataView(bytes.buffer);
        for (let i = 0; i < float32Array.length; i++) {
          const int16 = dataView.getInt16(i * 2, true); // little endian
          float32Array[i] = int16 / 32768.0; // normalize to -1 to 1
        }

        // Encode for OpenAI API
        const encodedAudio = encodeAudioForAPI(float32Array);
        
        // Send audio to OpenAI
        openAISocket?.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: encodedAudio
        }));
      }

      if (message.type === 'end_audio') {
        console.log("Audio input ended");
        // Commit the audio buffer
        openAISocket?.send(JSON.stringify({
          type: 'input_audio_buffer.commit'
        }));
      }

      if (message.type === 'reset') {
        console.log("Resetting transcription");
        fullTranscription = '';
      }

    } catch (error) {
      console.error("Error handling client message:", error);
      socket.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  };

  socket.onclose = () => {
    console.log("Client WebSocket closed");
    openAISocket?.close();
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    openAISocket?.close();
  };

  return response;
});