// Audio conversion utilities for browser compatibility

export interface ConversionResult {
  blob: Blob;
  format: string;
  sampleRate: number;
  channels: number;
  duration: number;
}

export interface ConversionOptions {
  targetSampleRate?: number;
  targetChannels?: number;
  targetFormat?: 'wav' | 'original';
}

class AudioConverter {
  private audioContext: AudioContext | null = null;

  /**
   * Get or create AudioContext
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Convert audio file to target format and specifications
   */
  async convertAudio(
    file: Blob, 
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const {
      targetSampleRate = 16000,
      targetChannels = 1,
      targetFormat = 'wav'
    } = options;

    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Decode audio data
      const audioContext = this.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const originalSampleRate = audioBuffer.sampleRate;
      const originalChannels = audioBuffer.numberOfChannels;
      const duration = audioBuffer.duration;

      // Check if conversion is needed
      const needsResampling = originalSampleRate !== targetSampleRate;
      const needsChannelConversion = originalChannels !== targetChannels;
      const needsFormatConversion = targetFormat === 'wav';

      if (!needsResampling && !needsChannelConversion && !needsFormatConversion) {
        // No conversion needed, return original
        return {
          blob: file,
          format: this.detectFormat(file),
          sampleRate: originalSampleRate,
          channels: originalChannels,
          duration
        };
      }

      // Convert to target specifications
      const convertedBuffer = await this.processAudioBuffer(
        audioBuffer,
        targetSampleRate,
        targetChannels
      );

      // Encode to target format
      let resultBlob: Blob;
      if (targetFormat === 'wav') {
        resultBlob = this.audioBufferToWav(convertedBuffer);
      } else {
        // For 'original', we still need to re-encode if we changed the audio
        resultBlob = this.audioBufferToWav(convertedBuffer);
      }

      return {
        blob: resultBlob,
        format: 'wav',
        sampleRate: targetSampleRate,
        channels: targetChannels,
        duration
      };

    } catch (error) {
      throw new Error(
        `Error converting audio: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process audio buffer to target sample rate and channels
   */
  private async processAudioBuffer(
    audioBuffer: AudioBuffer,
    targetSampleRate: number,
    targetChannels: number
  ): Promise<AudioBuffer> {
    const audioContext = this.getAudioContext();
    
    // Calculate new buffer length based on sample rate conversion
    const sampleRateRatio = targetSampleRate / audioBuffer.sampleRate;
    const newLength = Math.floor(audioBuffer.length * sampleRateRatio);
    
    // Create new buffer with target specifications
    const newBuffer = audioContext.createBuffer(
      targetChannels,
      newLength,
      targetSampleRate
    );

    // Process each target channel
    for (let channel = 0; channel < targetChannels; channel++) {
      const newChannelData = newBuffer.getChannelData(channel);
      
      if (targetChannels === 1) {
        // Mono output - mix all input channels
        this.mixToMono(audioBuffer, newChannelData, sampleRateRatio);
      } else {
        // Multi-channel output - map channels
        const sourceChannel = Math.min(channel, audioBuffer.numberOfChannels - 1);
        this.resampleChannel(
          audioBuffer.getChannelData(sourceChannel),
          newChannelData,
          sampleRateRatio
        );
      }
    }

    return newBuffer;
  }

  /**
   * Mix all channels to mono
   */
  private mixToMono(
    sourceBuffer: AudioBuffer,
    targetData: Float32Array,
    sampleRateRatio: number
  ): void {
    const sourceChannels = sourceBuffer.numberOfChannels;
    const sourceLength = sourceBuffer.length;

    for (let i = 0; i < targetData.length; i++) {
      const sourceIndex = i / sampleRateRatio;
      const index = Math.floor(sourceIndex);
      
      if (index >= sourceLength - 1) break;
      
      // Linear interpolation for resampling
      const fraction = sourceIndex - index;
      let mixedSample = 0;
      
      for (let channel = 0; channel < sourceChannels; channel++) {
        const channelData = sourceBuffer.getChannelData(channel);
        const sample1 = channelData[index];
        const sample2 = channelData[index + 1] || sample1;
        const interpolated = sample1 + (sample2 - sample1) * fraction;
        mixedSample += interpolated;
      }
      
      // Average the mixed channels
      targetData[i] = mixedSample / sourceChannels;
    }
  }

  /**
   * Resample a single channel
   */
  private resampleChannel(
    sourceData: Float32Array,
    targetData: Float32Array,
    sampleRateRatio: number
  ): void {
    for (let i = 0; i < targetData.length; i++) {
      const sourceIndex = i / sampleRateRatio;
      const index = Math.floor(sourceIndex);
      
      if (index >= sourceData.length - 1) break;
      
      // Linear interpolation
      const fraction = sourceIndex - index;
      const sample1 = sourceData[index];
      const sample2 = sourceData[index + 1] || sample1;
      targetData[i] = sample1 + (sample2 - sample1) * fraction;
    }
  }

  /**
   * Convert AudioBuffer to WAV blob
   */
  private audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataLength = audioBuffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        let sample = channelData[i];
        
        // Clamp to [-1, 1] and convert to 16-bit
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = Math.floor(sample * 0x7FFF);
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Write string to DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Detect audio format from blob
   */
  private detectFormat(blob: Blob): string {
    if (blob.type.includes('wav')) return 'wav';
    if (blob.type.includes('mp3') || blob.type.includes('mpeg')) return 'mp3';
    if (blob.type.includes('webm')) return 'webm';
    return 'unknown';
  }

  /**
   * Check if audio needs conversion for optimal transcription
   */
  needsConversion(
    file: Blob,
    metadata?: { sampleRate?: number; channels?: number }
  ): boolean {
    // Always convert to ensure compatibility
    if (metadata) {
      return metadata.sampleRate !== 16000 || metadata.channels !== 1;
    }
    
    // If no metadata, assume conversion needed for non-WAV files
    return !file.type.includes('wav');
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Export singleton instance
export const audioConverter = new AudioConverter();