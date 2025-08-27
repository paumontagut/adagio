import { useEffect, useRef } from 'react';

interface AccessibilityAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  delay?: number;
}

export const AccessibilityAnnouncer = ({ 
  message, 
  priority = 'polite', 
  delay = 100 
}: AccessibilityAnnouncerProps) => {
  const announceRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (message && announceRef.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Clear the current message
      announceRef.current.textContent = '';

      // Set the new message after a small delay to ensure screen readers pick it up
      timeoutRef.current = setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = message;
        }
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, delay]);

  return (
    <div
      ref={announceRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  );
};