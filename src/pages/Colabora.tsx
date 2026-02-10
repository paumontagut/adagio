import { ExternalLink, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo.svg";

export const Colabora = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div
      className="min-h-screen w-full flex flex-col selection:bg-primary/20 selection:text-white"
      style={{ backgroundColor: "#F5F8DE", color: "#0D0C1D" }}
    >
      {/* Logo */}
      <Link
        to="/"
        className="absolute top-4 left-4 md:left-6 z-50 flex-shrink-0 hover:opacity-80 transition-opacity"
      >
        <img src={logo} alt="Adagio Logo" className="h-12 md:h-20 lg:h-24 w-auto" />
      </Link>

      {/* Floating Navigation Bar */}
      <div className="fixed top-4 md:top-6 left-0 right-0 z-40 flex justify-center px-2 md:px-4">
        <nav className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-white/70 backdrop-blur-xl border border-white/50 rounded-full shadow-sm hover:shadow-md transition-all duration-300 w-auto max-w-2xl">
          <div className="flex items-center gap-0.5 md:gap-1">
            <button
              onClick={() => navigate("/?tab=transcribe")}
              className="rounded-full px-3 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-all bg-transparent text-black/60 hover:bg-black/5 hover:text-black"
            >
              {isMobile ? "Transcribir" : "Transcribir"}
            </button>
            <button
              onClick={() => navigate("/?tab=train")}
              className="rounded-full px-3 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-all bg-transparent text-black/60 hover:bg-black/5 hover:text-black"
            >
              {isMobile ? "Entrenar" : "Entrenar Modelo"}
            </button>
            <button
              className="rounded-full px-3 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-all bg-white text-black shadow-sm"
            >
              {isMobile ? "Colaborar" : "Colabora con Adagio"}
            </button>
          </div>

          <div className="w-px h-5 md:h-6 bg-black/10 mx-1 md:mx-2"></div>

          <div className="flex-shrink-0">
            {user ? (
              <UserMenu />
            ) : (
              !loading && (
                <button
                  onClick={() => navigate("/auth")}
                  className="bg-[#005C64] text-white px-3 md:px-6 py-2 md:py-2.5 rounded-full font-semibold text-xs md:text-sm flex items-center gap-1 md:gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </button>
              )
            )}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 md:px-8 pt-24 md:pt-32 pb-12 md:pb-20">
        <div className="w-full max-w-2xl">
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 lg:p-14 shadow-sm relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-[#90C2E7]/20 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 md:w-48 h-24 md:h-48 bg-[#FFBC42]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="space-y-6 md:space-y-8 text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Ayúdanos a dar voz a{" "}
                <span className="text-[#005C64]">más personas.</span>
              </h1>

              <p className="text-sm md:text-base text-foreground/70 leading-relaxed max-w-lg mx-auto">
                En Adagio trabajamos para que hablar (o ser entendido) no sea una barrera.
                Si quieres sumar tu tiempo, tu organización o tus recursos, nos encantará conocerte.
              </p>

              {/* CTA Button */}
              <div className="flex flex-col items-center gap-3">
                <a
                  href="https://forms.gle/NECq49HXrzDV1e7b7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#005C64] text-white px-8 py-3.5 rounded-full font-semibold text-sm md:text-base shadow-md hover:shadow-lg hover:shadow-[#005C64]/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005C64] focus-visible:ring-offset-2 transition-all w-full sm:w-auto"
                >
                  Quiero colaborar
                  <ExternalLink className="w-4 h-4" />
                </a>

                <span className="text-xs text-foreground/40">
                  Se abre en Google Forms (enlace externo)
                </span>
              </div>

              {/* Privacy notice */}
              <p className="text-xs text-foreground/50 max-w-md mx-auto leading-relaxed">
                Usaremos tus datos solo para ponernos en contacto contigo sobre esta colaboración.
                Consulta la{" "}
                <Link
                  to="/privacy-policy"
                  className="underline underline-offset-2 hover:text-[#005C64] transition-colors"
                >
                  Política de Privacidad
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className="mt-auto relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Colabora;
