// Utility functions for managing participant full name persistence

/**
 * Store the participant's full name in localStorage
 * @param name - The full name to store (will be trimmed)
 */
export function setParticipantName(name: string): void {
  localStorage.setItem("participant_full_name", name.trim());
}

/**
 * Retrieve the stored participant's full name
 * @returns The stored full name or null if not set
 */
export function getParticipantName(): string | null {
  return localStorage.getItem("participant_full_name");
}

/**
 * Clear the stored participant's full name
 */
export function clearParticipantName(): void {
  localStorage.removeItem("participant_full_name");
}