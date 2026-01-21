import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Loader2, LogIn } from "lucide-react";
import logo from "@/assets/logo.svg";

export const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const redirectUrl = window.location.origin + "/auth/callback";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error.message || "No se pudo iniciar sesión con Google.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full font-sans selection:bg-[#005C64] selection:text-white bg-[#F5F8DE] text-[#0D0C1D] flex flex-col">
      {/* --- BOTÓN "VOLVER" FLOTANTE --- */}
      <div className="fixed top-4 md:top-6 right-4 md:right-6 z-50">
        <Link to="/">
          <Button
            variant="ghost"
            className="rounded-full bg-white/70 backdrop-blur-md border border-white/50 hover:bg-black/5 text-[#0D0C1D] shadow-sm px-3 md:px-4 py-2 text-xs md:text-sm"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 md:px-8 pt-16 md:pt-20 pb-12 md:pb-20 flex flex-col items-center justify-center min-h-[80vh]">
        {/* Cabecera de Página (Logo y Título) */}
        <div className="text-center mb-8 md:mb-12 space-y-4 md:space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <img src={logo} alt="Adagio Logo" className="h-20 md:h-32 lg:h-40 w-auto -ml-2 md:-ml-4" />
          </Link>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#0D0C1D] tracking-tight">Bienvenido a Adagio</h1>
            <p className="text-[#0D0C1D]/60 font-medium text-sm md:text-lg max-w-md mx-auto px-4">
              Inicia sesión para gestionar tus grabaciones y entrenar tu modelo de voz personalizado.
            </p>
          </div>
        </div>

        {/* --- PANEL DE CRISTAL (Login) --- */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 lg:p-12 shadow-xl w-full max-w-md relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 mx-3">
          {/* Decoración de fondo sutil */}
          <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-[#90C2E7]/20 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 md:w-48 h-24 md:h-48 bg-[#005C64]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="space-y-6 md:space-y-8">
            {/* Botón de Acción Principal */}
            <div className="space-y-3 md:space-y-4">
              <Button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full h-12 md:h-14 text-base md:text-lg bg-[#005C64] hover:bg-[#004a50] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <LogIn className="mr-2 h-4 w-4 md:h-5 md:w-5" />}
                Continuar con Google
              </Button>

              <p className="text-center text-xs md:text-sm text-[#0D0C1D]/40">
                Al continuar, aceptas nuestros{" "}
                <Link to="/terms" className="underline hover:text-[#005C64]">
                  Términos
                </Link>{" "}
                y{" "}
                <Link to="/privacy-policy" className="underline hover:text-[#005C64]">
                  Política de Privacidad
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer simple */}
      <div className="pb-4 md:pb-6 text-center text-[#0D0C1D]/30 text-xs md:text-sm">
        © {new Date().getFullYear()} Adagio. Todos los derechos reservados.
      </div>
    </div>
  );
};
