import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="container max-w-2xl mx-auto px-6 py-8 sm:py-12">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-12 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>

        {/* Eyebrow */}
        <p
          className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Mis puntos
        </p>

        {/* Hero number — monumental, sin caja */}
        <div className="mb-4">
          <div
            className="text-[8rem] sm:text-[12rem] leading-none font-bold text-primary tabular-nums tracking-tighter"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            aria-live="polite"
          >
            {loading ? '—' : totalPoints}
          </div>
        </div>

        <p className="text-lg text-muted-foreground mb-12 max-w-md leading-relaxed">
          Cada validación y corrección que aportas mejora el reconocimiento de
          voz para personas con habla atípica.
        </p>

        {/* Stats inline, tipografía editorial */}
        <div className="flex items-baseline gap-10 sm:gap-16 mb-16 pb-12 border-b border-foreground/10">
          <div>
            <div
              className="text-4xl font-semibold tabular-nums"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {feedbackCount}
            </div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
              Validaciones
            </div>
          </div>
          <div className="w-px h-12 bg-foreground/10" aria-hidden="true" />
          <div>
            <div
              className="text-4xl font-semibold tabular-nums"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {correctionsCount}
            </div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
              Correcciones
            </div>
          </div>
        </div>

        {/* Cómo se ganan — lista refinada */}
        <section className="mb-16">
          <p
            className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-8"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Cómo se ganan
          </p>

          <ul className="divide-y divide-foreground/10">
            <li className="flex items-baseline justify-between gap-6 py-6">
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-1">
                  Validar una transcripción
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Confirma con Sí o No si la transcripción es correcta.
                </p>
              </div>
              <div
                className="text-3xl font-bold text-primary tabular-nums whitespace-nowrap"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                +5
              </div>
            </li>

            <li className="flex items-baseline justify-between gap-6 py-6">
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-1">
                  Aportar una corrección
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Escribe lo que querías decir cuando la transcripción no es
                  correcta.
                </p>
              </div>
              <div
                className="text-3xl font-bold text-accent tabular-nums whitespace-nowrap"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                +15
              </div>
            </li>
          </ul>
        </section>

        {/* Próximamente — minimal, sin card */}
        <section className="border-t border-foreground/10 pt-10">
          <p
            className="text-xs uppercase tracking-[0.25em] text-accent-foreground/70 mb-3"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Próximamente
          </p>
          <h3
            className="text-2xl sm:text-3xl font-semibold mb-3 tracking-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Canjea tus puntos por recompensas
          </h3>
          <p className="text-muted-foreground leading-relaxed max-w-lg">
            Estamos trabajando en un sistema de recompensas para que tu
            contribución tenga un retorno tangible. Mientras tanto, gracias por
            seguir aportando.
          </p>
        </section>
      </div>
    </div>
  );
};

export default MyPoints;
