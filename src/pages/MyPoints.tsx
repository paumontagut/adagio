import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, PencilLine, Gift } from 'lucide-react';
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow blobs para reforzar el liquid glass */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-40 w-[28rem] h-[28rem] rounded-full bg-accent/25 blur-3xl"
      />

      <div className="container max-w-2xl mx-auto px-6 py-8 sm:py-12 relative">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-10 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>

        {/* Hero glass card */}
        <section
          className="relative rounded-[2.5rem] border border-white/40 bg-white/60 backdrop-blur-xl shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.25)] p-8 sm:p-12 mb-8 overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
          />

          <p
            className="text-xs uppercase tracking-[0.3em] text-primary mb-6 flex items-center gap-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Mis puntos
          </p>

          <div
            className="text-[7rem] sm:text-[10rem] leading-none font-bold text-primary tabular-nums tracking-tighter mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            aria-live="polite"
          >
            {loading ? '—' : totalPoints}
          </div>

          <p className="text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed mb-10">
            Cada validación y corrección que aportas mejora el reconocimiento
            de voz para personas con habla atípica.
          </p>

          {/* Stats inline con divisor sutil */}
          <div className="flex items-baseline gap-10 sm:gap-14 pt-8 border-t border-foreground/10">
            <div>
              <div
                className="text-3xl sm:text-4xl font-semibold tabular-nums"
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
                className="text-3xl sm:text-4xl font-semibold tabular-nums"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {correctionsCount}
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
                Correcciones
              </div>
            </div>
          </div>
        </section>

        {/* Cómo se ganan — glass card */}
        <section
          className="rounded-[2rem] border border-white/40 bg-white/60 backdrop-blur-xl p-8 sm:p-10 mb-8"
        >
          <p
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-8"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Cómo se ganan
          </p>

          <ul className="divide-y divide-foreground/10 -my-2">
            <li className="flex items-center gap-5 py-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium mb-0.5">
                  Validar una transcripción
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Confirma con Sí o No si la transcripción es correcta.
                </p>
              </div>
              <div
                className="text-2xl sm:text-3xl font-bold text-primary tabular-nums whitespace-nowrap"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                +5
              </div>
            </li>

            <li className="flex items-center gap-5 py-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
                <PencilLine className="h-5 w-5 text-accent-foreground" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium mb-0.5">
                  Aportar una corrección
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Escribe lo que querías decir cuando no es correcta.
                </p>
              </div>
              <div
                className="text-2xl sm:text-3xl font-bold text-accent-foreground tabular-nums whitespace-nowrap"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                +15
              </div>
            </li>
          </ul>
        </section>

        {/* Próximamente — glass card */}
        <section
          className="rounded-[2rem] border border-white/40 bg-white/60 backdrop-blur-xl p-8 sm:p-10"
        >
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p
                className="text-xs uppercase tracking-[0.3em] text-primary mb-3"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Próximamente
              </p>
              <h3
                className="text-xl sm:text-2xl font-semibold mb-3 tracking-tight"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Canjea tus puntos por recompensas
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Estamos trabajando en un sistema de recompensas para que tu
                contribución tenga un retorno tangible. Mientras tanto,
                gracias por seguir aportando.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MyPoints;
