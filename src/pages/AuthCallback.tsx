import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/');
          return;
        }

        if (data.session) {
          // Successful authentication, redirect to home
          navigate('/');
        } else {
          // No session found, redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#005c64] flex items-center justify-center">
      <Card className="p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Autenticando...</h2>
          <p className="text-muted-foreground">
            Por favor espera mientras procesamos tu inicio de sesión.
          </p>
        </div>
      </Card>
    </div>
  );
};