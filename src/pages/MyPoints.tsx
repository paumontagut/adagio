import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle2, PencilLine, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPoints } from '@/hooks/useUserPoints';

export const MyPoints = () => {
  const { user, loading: authLoading } = useAuth();
  const { totalPoints, feedbackCount, correctionsCount, loading } = useUserPoints();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Mis puntos · Adagio';
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>

        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Mis puntos
          </h1>
          <p className="text-muted-foreground text-lg">
            Tu contribución para mejorar Adagio
          </p>
        </header>

        {/* Hero: puntos en grande */}
        <Card className="p-10 sm:p-12 mb-8 text-center bg-white/60 backdrop-blur-xl border rounded-[2.5rem]">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Sparkles className="h-10 w-10 text-primary" aria-hidden="true" />
          </div>
          <div
            className="text-7xl sm:text-8xl font-bold text-primary mb-2 tabular-nums"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            aria-live="polite"
          >
            {loading ? '—' : totalPoints}
          </div>
          <p className="text-muted-foreground text-lg">
            {totalPoints === 1 ? 'punto acumulado' : 'puntos acumulados'}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t">
            <div>
              <div className="text-2xl font-semibold tabular-nums">{feedbackCount}</div>
              <div className="text-sm text-muted-foreground">Validaciones</div>
            </div>
            <div>
              <div className="text-2xl font-semibold tabular-nums">{correctionsCount}</div>
              <div className="text-sm text-muted-foreground">Correcciones</div>
            </div>
          </div>
        </Card>

        {/* Cómo se ganan */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            ¿Cómo se ganan puntos?
          </h2>
          <div className="space-y-3">
            <Card className="p-5 flex items-center gap-4 bg-white/60 backdrop-blur-xl rounded-2xl">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Valida una transcripción</div>
                <p className="text-sm text-muted-foreground">
                  Confirma con "Sí" o "No" si la transcripción es correcta.
                </p>
              </div>
              <div className="text-xl font-bold text-primary tabular-nums whitespace-nowrap">+5</div>
            </Card>

            <Card className="p-5 flex items-center gap-4 bg-white/60 backdrop-blur-xl rounded-2xl">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <PencilLine className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Aporta una corrección</div>
                <p className="text-sm text-muted-foreground">
                  Escribe lo que querías decir cuando la transcripción no es correcta.
                </p>
              </div>
              <div className="text-xl font-bold text-primary tabular-nums whitespace-nowrap">+15</div>
            </Card>
          </div>
        </section>

        {/* Próximamente */}
        <Card className="p-6 sm:p-8 bg-primary/5 border-primary/20 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Próximamente: canjea tus puntos
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Estamos trabajando en un sistema de recompensas para que puedas
                canjear los puntos que acumulas. Mientras tanto, cada validación y
                corrección nos ayuda a mejorar el reconocimiento de voz para
                personas con habla atípica. ¡Gracias por tu contribución!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MyPoints;
