import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'adagio_guest_session_id';

export const getGuestSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    sessionId = `guest_${uuidv4()}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
};

export const clearGuestSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};