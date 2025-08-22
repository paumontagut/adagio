import { v4 as uuidv4 } from 'uuid';

export interface SessionData {
  sessionId: string;
  consentGiven: boolean;
  shareAnalytics: boolean;
  createdAt: string;
}

export interface AnalyticsEvent {
  event: string;
  sessionId: string;
  timestamp: string;
  data?: Record<string, any>;
}

class SessionManager {
  private sessionData: SessionData | null = null;
  private readonly STORAGE_KEY = 'adagio_session';

  initSession(): SessionData {
    // Try to load existing session
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.sessionData = JSON.parse(stored);
        if (this.sessionData) {
          return this.sessionData;
        }
      } catch (e) {
        console.warn('Invalid session data, creating new session');
      }
    }

    // Create new session
    this.sessionData = {
      sessionId: uuidv4(),
      consentGiven: false,
      shareAnalytics: true, // Default to true, user can opt out
      createdAt: new Date().toISOString()
    };

    this.saveSession();
    return this.sessionData;
  }

  getSession(): SessionData | null {
    if (!this.sessionData) {
      return this.initSession();
    }
    return this.sessionData;
  }

  updateConsent(consentGiven: boolean): void {
    if (!this.sessionData) {
      this.initSession();
    }
    
    if (this.sessionData) {
      this.sessionData.consentGiven = consentGiven;
      this.saveSession();
    }
  }

  updateAnalyticsConsent(shareAnalytics: boolean): void {
    if (!this.sessionData) {
      this.initSession();
    }
    
    if (this.sessionData) {
      this.sessionData.shareAnalytics = shareAnalytics;
      this.saveSession();
    }
  }

  private saveSession(): void {
    if (this.sessionData) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sessionData));
    }
  }

  // Analytics event tracking (minimal, no PII)
  trackEvent(event: string, data?: Record<string, any>): void {
    const session = this.getSession();
    if (!session || !session.shareAnalytics) {
      return; // Don't track if user opted out
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      sessionId: session.sessionId,
      timestamp: new Date().toISOString(),
      data: data ? { ...data } : undefined // Ensure no PII in data
    };

    // Send to analytics endpoint (would be implemented with Supabase)
    this.sendAnalyticsEvent(analyticsEvent);
  }

  private async sendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // This would be implemented with Supabase Edge Functions
      console.log('Analytics event:', event); // For now, just log
      
      // Example implementation:
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  // Predefined analytics events
  pageView(page: string): void {
    this.trackEvent('page_view', { page });
  }

  recordStart(): void {
    this.trackEvent('record_start');
  }

  recordStop(duration: number): void {
    this.trackEvent('record_stop', { duration });
  }

  transcribeRequest(): void {
    this.trackEvent('transcribe_request');
  }

  transcribeSuccess(duration: number): void {
    this.trackEvent('transcribe_success', { duration });
  }

  transcribeError(error: string): void {
    this.trackEvent('transcribe_error', { error_type: error });
  }

  trainUpload(): void {
    this.trackEvent('train_upload');
  }

  trainUploadSuccess(): void {
    this.trackEvent('train_upload_success');
  }

  trainUploadError(error: string): void {
    this.trackEvent('train_upload_error', { error_type: error });
  }
}

export const sessionManager = new SessionManager();