/**
 * Client-side AES-256-GCM encryption for audio files
 * Implements GDPR-compliant encryption with key rotation support
 */

export interface EncryptionResult {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  keyVersion: number;
}

export interface DecryptionParams {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  keyVersion: number;
}

export class AudioEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly SALT_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits for GCM

  /**
   * Generate a cryptographically secure random key derivation salt
   */
  private static generateSalt(): Uint8Array {
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    // Create a new Uint8Array to ensure proper typing
    return new Uint8Array(salt.buffer.slice(0));
  }

  /**
   * Generate a cryptographically secure random initialization vector
   */
  private static generateIV(): Uint8Array {
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    // Create a new Uint8Array to ensure proper typing
    return new Uint8Array(iv.buffer.slice(0));
  }

  /**
   * Derive AES-256 key from master key and salt using PBKDF2
   */
  private static async deriveKey(
    masterKey: string, 
    salt: Uint8Array, 
    iterations: number = 100000
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(masterKey),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt audio blob using AES-256-GCM
   */
  public static async encryptAudio(
    audioBlob: Blob, 
    masterKey: string, 
    keyVersion: number = 1
  ): Promise<EncryptionResult> {
    try {
      // Convert blob to ArrayBuffer
      const audioData = await audioBlob.arrayBuffer();
      
      // Generate cryptographic parameters
      const salt = this.generateSalt();
      const iv = this.generateIV();
      
      // Derive encryption key
      const derivedKey = await this.deriveKey(masterKey, salt);
      
      // Encrypt the audio data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv.buffer as ArrayBuffer,
          tagLength: this.TAG_LENGTH * 8 // bits
        },
        derivedKey,
        audioData
      );

      console.log('Audio encrypted successfully', {
        originalSize: audioData.byteLength,
        encryptedSize: encryptedData.byteLength,
        keyVersion: keyVersion
      });

      return {
        encryptedData,
        iv,
        salt,
        keyVersion
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt audio data');
    }
  }

  /**
   * Decrypt audio data using AES-256-GCM
   */
  public static async decryptAudio(
    params: DecryptionParams, 
    masterKey: string
  ): Promise<ArrayBuffer> {
    try {
      // Derive the same key used for encryption
      const derivedKey = await this.deriveKey(masterKey, params.salt);
      
      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: params.iv.buffer as ArrayBuffer,
          tagLength: this.TAG_LENGTH * 8
        },
        derivedKey,
        params.encryptedData
      );

      console.log('Audio decrypted successfully', {
        decryptedSize: decryptedData.byteLength,
        keyVersion: params.keyVersion
      });

      return decryptedData;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt audio data');
    }
  }

  /**
   * Generate a secure pseudonym from session ID
   */
  public static async generatePseudonym(sessionId: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(sessionId + Date.now().toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    const hashHex = Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return 'ps_' + hashHex.substring(0, 32);
  }

  /**
   * Convert ArrayBuffer to Base64 for storage
   */
  public static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer for decryption
   */
  public static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert Uint8Array to Base64 for storage
   */
  public static uint8ArrayToBase64(array: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < array.byteLength; i++) {
      binary += String.fromCharCode(array[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to Uint8Array
   */
  public static base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Validate encryption parameters
   */
  public static validateEncryptionParams(params: DecryptionParams): boolean {
    return (
      params.encryptedData &&
      params.iv &&
      params.salt &&
      params.keyVersion > 0 &&
      params.iv.length === this.IV_LENGTH &&
      params.salt.length === this.SALT_LENGTH
    );
  }

  /**
   * Generate master key for client-side use (should be from secure source)
   */
  public static generateMasterKey(): string {
    const array = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}