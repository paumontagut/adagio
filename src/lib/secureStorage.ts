// Secure storage utility for sensitive data like admin sessions
import { logger } from './secureLogger';

interface EncryptedSession {
  token: string;
  expires: number;
  checksum: string;
}

class SecureStorage {
  private readonly PREFIX = 'adagio_secure_';
  private readonly SESSION_KEY = 'admin_session';

  // Simple encryption using Web Crypto API (better than plain localStorage)
  private async generateKey(): Promise<CryptoKey> {
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.getDeviceFingerprint()),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('adagio-salt-2025'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private getDeviceFingerprint(): string {
    return `${navigator.userAgent}-${screen.width}x${screen.height}-${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  }

  private async encryptData(data: string): Promise<string> {
    try {
      const key = await this.generateKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(data);

      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      const result = {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted))
      };

      return btoa(JSON.stringify(result));
    } catch (error) {
      logger.error('Encryption failed', error as Error, { component: 'SecureStorage' });
      throw new Error('Failed to encrypt session data');
    }
  }

  private async decryptData(encryptedData: string): Promise<string> {
    try {
      const key = await this.generateKey();
      const { iv, data } = JSON.parse(atob(encryptedData));

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        new Uint8Array(data)
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      logger.error('Decryption failed', error as Error, { component: 'SecureStorage' });
      throw new Error('Failed to decrypt session data');
    }
  }

  async setAdminSession(token: string, expiresInHours: number = 4): Promise<void> {
    try {
      const sessionData: EncryptedSession = {
        token,
        expires: Date.now() + (expiresInHours * 60 * 60 * 1000),
        checksum: await this.generateChecksum(token)
      };

      const encrypted = await this.encryptData(JSON.stringify(sessionData));
      sessionStorage.setItem(this.PREFIX + this.SESSION_KEY, encrypted);
      
      logger.info('Admin session stored securely', { 
        component: 'SecureStorage',
        action: 'setSession'
      });
    } catch (error) {
      logger.error('Failed to store admin session securely', error as Error);
      throw error;
    }
  }

  async getAdminSession(): Promise<string | null> {
    try {
      const encrypted = sessionStorage.getItem(this.PREFIX + this.SESSION_KEY);
      if (!encrypted) return null;

      const decrypted = await this.decryptData(encrypted);
      const sessionData: EncryptedSession = JSON.parse(decrypted);

      // Check if session is expired
      if (Date.now() > sessionData.expires) {
        await this.clearAdminSession();
        return null;
      }

      // Verify checksum
      const expectedChecksum = await this.generateChecksum(sessionData.token);
      if (expectedChecksum !== sessionData.checksum) {
        logger.warn('Session checksum mismatch - possible tampering', {
          component: 'SecureStorage'
        });
        await this.clearAdminSession();
        return null;
      }

      return sessionData.token;
    } catch (error) {
      logger.error('Failed to retrieve admin session', error as Error);
      await this.clearAdminSession();
      return null;
    }
  }

  async clearAdminSession(): Promise<void> {
    sessionStorage.removeItem(this.PREFIX + this.SESSION_KEY);
    logger.info('Admin session cleared', { 
      component: 'SecureStorage',
      action: 'clearSession'
    });
  }

  private async generateChecksum(data: string): Promise<string> {
    const encoded = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const secureStorage = new SecureStorage();