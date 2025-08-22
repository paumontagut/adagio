// Audio processing utilities for recording optimization

export interface AudioMetrics {
  duration: number; // in seconds
  sampleRate: number;
  channels: number;
  rmsLevel: number;
  peakLevel: number;
  size: number; // in bytes
}

export interface ProcessingResult {
  blob: Blob;
  metrics: AudioMetrics;
  isValid: boolean;
  warnings: string[];
}

// Minimum RMS threshold for acceptable audio quality
const MIN_RMS_THRESHOLD = 0.01; // Adjust based on testing
const MIN_DURATION = 1; // seconds
const MAX_DURATION = 30; // seconds
const TARGET_SAMPLE_RATE = 16000;

export class AudioProcessor {
  private audioContext: AudioContext | null = null;

  async processRecording(blob: Blob): Promise<ProcessingResult> {
    try {
      // Convert blob to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();
      
      // Create audio context if needed
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
      
      // Analyze audio metrics
      const metrics = this.analyzeAudio(audioBuffer);
      
      // Process audio (convert to 16kHz mono, normalize)
      const processedBuffer = await this.processAudioBuffer(audioBuffer);
      
      // Convert back to WAV blob
      const processedBlob = this.audioBufferToWav(processedBuffer);
      
      // Validate audio quality
      const validation = this.validateAudio(metrics);
      
      return {
        blob: processedBlob,
        metrics: {
          ...metrics,
          size: processedBlob.size
        },
        isValid: validation.isValid,
        warnings: validation.warnings
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      throw new Error('Error al procesar el audio');
    }
  }

  private analyzeAudio(audioBuffer: AudioBuffer): AudioMetrics {
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;

    // Calculate RMS and peak levels
    let sum = 0;
    let peak = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.abs(channelData[i]);
      sum += sample * sample;
      peak = Math.max(peak, sample);
    }
    
    const rms = Math.sqrt(sum / channelData.length);

    return {
      duration,
      sampleRate,
      channels,
      rmsLevel: rms,
      peakLevel: peak,
      size: 0 // Will be set after processing
    };
  }

  private async processAudioBuffer(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    // Create offline context for processing
    const offlineContext = new OfflineAudioContext(
      1, // mono
      Math.floor(audioBuffer.duration * TARGET_SAMPLE_RATE),
      TARGET_SAMPLE_RATE
    );

    // Create source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Convert to mono if needed
    let processedSource = source;
    if (audioBuffer.numberOfChannels > 1) {
      const merger = offlineContext.createChannelMerger(1);
      const splitter = offlineContext.createChannelSplitter(audioBuffer.numberOfChannels);
      
      source.connect(splitter);
      splitter.connect(merger, 0, 0); // Take left channel
      if (audioBuffer.numberOfChannels > 1) {
        splitter.connect(merger, 1, 0); // Mix with right channel
      }
      
      merger.connect(offlineContext.destination);
    } else {
      source.connect(offlineContext.destination);
    }

    // Apply light normalization (-1dB peak)
    const gainNode = offlineContext.createGain();
    source.connect(gainNode);
    gainNode.connect(offlineContext.destination);
    
    // Calculate normalization factor
    const channelData = audioBuffer.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < channelData.length; i++) {
      peak = Math.max(peak, Math.abs(channelData[i]));
    }
    
    // Normalize to -1dB (0.891 linear gain)
    const targetPeak = 0.891; // -1dB
    const gainValue = peak > 0 ? Math.min(targetPeak / peak, 1) : 1;
    gainNode.gain.value = gainValue;

    source.start();
    return await offlineContext.startRendering();
  }

  private validateAudio(metrics: AudioMetrics): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let isValid = true;

    // Check duration
    if (metrics.duration < MIN_DURATION) {
      isValid = false;
      warnings.push(`Grabación muy corta (${metrics.duration.toFixed(1)}s). Mínimo ${MIN_DURATION}s.`);
    }
    
    if (metrics.duration > MAX_DURATION) {
      isValid = false;
      warnings.push(`Grabación muy larga (${metrics.duration.toFixed(1)}s). Máximo ${MAX_DURATION}s.`);
    }

    // Check RMS level (audio quality)
    if (metrics.rmsLevel < MIN_RMS_THRESHOLD) {
      isValid = false;
      warnings.push('Audio muy silencioso. Habla más cerca del micrófono.');
    }

    // Check for clipping
    if (metrics.peakLevel >= 0.98) {
      warnings.push('Posible saturación del audio. Habla más suave o aleja el micrófono.');
    }

    // Quality recommendations
    if (metrics.rmsLevel < 0.05 && metrics.rmsLevel >= MIN_RMS_THRESHOLD) {
      warnings.push('Tip: Habla un poco más cerca del micrófono para mejor calidad.');
    }

    return { isValid, warnings };
  }

  private audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Convert float samples to 16-bit PCM
    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const audioProcessor = new AudioProcessor();