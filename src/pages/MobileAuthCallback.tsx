// Deploy marker: mobile auth callback route — ensure server bundle includes /auth/mobile-callback
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const MOBILE_SCHEME = 'adagio://auth/callback';

export const MobileAuthCallback = () => {
  const [hash, setHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const rawHash = window.location.hash || '';
    if (!rawHash || rawHash.length <= 1) {
      setError('Error: no se recibieron credenciales');
      return;
    }
    setHash(rawHash);
    // Auto-redirect to mobile app
    window.location.href = `${MOBILE_SCHEME}${rawHash}`;
  }, []);

  const openApp = () => {
    if (hash) {
      window.location.href = `${MOBILE_SCHEME}${hash}`;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {error ? (
          <>
            <h1 className="text-2xl font-semibold text-foreground">{error}</h1>
            <p className="text-muted-foreground">
              Vuelve a la app de Adagio e inicia sesión de nuevo.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-foreground">
              Redirigiendo a Adagio...
            </h1>
            <p className="text-muted-foreground">
              Si la app no se abre automáticamente, pulsa el botón.
            </p>
            <Button onClick={openApp} size="lg" variant="default">
              Abrir Adagio
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileAuthCallback;
