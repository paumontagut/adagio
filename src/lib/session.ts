import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'adagio_guest_session_id';
const TRAIN_CONSENT_KEYS = {
  fullName: 'train_full_name',
  consentTrain: 'train_consent_train',
  consentStore: 'train_consent_store',
  consentAt: 'train_consent_at'
};

export const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    sessionId = `guest_${uuidv4()}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
};

export const clearGuestSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
  Object.values(TRAIN_CONSENT_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

export const getStoredConsent = () => {
  const fullName = localStorage.getItem(TRAIN_CONSENT_KEYS.fullName);
  const consentTrain = localStorage.getItem(TRAIN_CONSENT_KEYS.consentTrain) === 'true';
  const consentStore = localStorage.getItem(TRAIN_CONSENT_KEYS.consentStore) === 'true';
  const consentAt = localStorage.getItem(TRAIN_CONSENT_KEYS.consentAt);

  return {
    hasValidConsent: !!(fullName && consentTrain && consentStore && consentAt),
    fullName: fullName || '',
    consentTrain,
    consentStore,
    consentAt: consentAt || ''
  };
};

export const storeConsent = (fullName: string, consentTrain: boolean, consentStore: boolean) => {
  const consentAt = new Date().toISOString();
  
  localStorage.setItem(TRAIN_CONSENT_KEYS.fullName, fullName);
  localStorage.setItem(TRAIN_CONSENT_KEYS.consentTrain, String(consentTrain));
  localStorage.setItem(TRAIN_CONSENT_KEYS.consentStore, String(consentStore));
  localStorage.setItem(TRAIN_CONSENT_KEYS.consentAt, consentAt);
  
  return consentAt;
};