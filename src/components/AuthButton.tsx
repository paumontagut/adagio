import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';

export const AuthButton = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      toast.error('Error al iniciar sesión');
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      variant="outline"
      size="sm"
      className="bg-white/10 text-white border-white/20 hover:bg-white/20"
    >
      {loading ? 'Autenticando...' : 'Continuar con Google'}
    </Button>
  );
};