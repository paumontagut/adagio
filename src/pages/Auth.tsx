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
      <div className="fixed top-6 right-6 z-50">
        <Link to="/">
          <Button
            variant="ghost"
            className="rounded-full bg-white/70 backdrop-blur-md border border-white/50 hover:bg-black/5 text-[#0D0C1D] shadow-sm px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-20 flex flex-col items-center justify-center min-h-[80vh]">
        {/* Cabecera de Página (Logo y Título) */}
        <div className="text-center mb-12 space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <img src={logo} alt="Adagio Logo" className="h-32 md:h-40 w-auto -ml-4" />
          </Link>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-[#0D0C1D] tracking-tight">Bienvenido a Adagio</h1>
            <p className="text-[#0D0C1D]/60 font-medium text-lg max-w-md mx-auto">
              Inicia sesión para gestionar tus grabaciones y entrenar tu modelo de voz personalizado.
            </p>
          </div>
        </div>

        {/* --- PANEL DE CRISTAL (Login) --- */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 md:p-12 shadow-xl w-full max-w-md relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
          {/* Decoración de fondo sutil */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#90C2E7]/20 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#005C64]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="space-y-8">
            {/* Botón de Acción Principal */}
            <div className="space-y-4">
              <Button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full h-14 text-lg bg-[#005C64] hover:bg-[#004a50] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                Continuar con Google
              </Button>

              <p className="text-center text-sm text-[#0D0C1D]/40">
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

      {/* Footer simple o copyright si lo deseas */}
      <div className="pb-6 text-center text-[#0D0C1D]/30 text-sm">
        © {new Date().getFullYear()} Adagio. Todos los derechos reservados.
      </div>
    </div>
  );
};
