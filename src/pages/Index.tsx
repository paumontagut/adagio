import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TranscribeView } from "@/components/TranscribeView";
import { TrainView } from "@/components/TrainView";
import { Footer } from "@/components/Footer";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, LogIn } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo.svg";

const colors = {
  bg: "#F5F8DE", // Crema
  primary: "#005C64", // Teal
  dark: "#0D0C1D", // Negro Suave
  accent: "#FFBC42", // Amarillo
};

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("transcribe");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "train" || tabParam === "transcribe") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleLoginClick = () => {
    navigate("/auth");
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        setActiveTab(value);
        setSearchParams({ tab: value });
      }}
      className="min-h-screen w-full font-sans flex flex-col"
    >
      <div
        className="min-h-screen w-full flex flex-col selection:bg-[#005C64] selection:text-white"
        style={{ backgroundColor: colors.bg, color: colors.dark }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-black text-white p-4 rounded-lg z-[100]"
        >
          Saltar al contenido principal
        </a>

        {/* --- LOGO: centrado en móvil, esquina sup. izq. en desktop --- */}
        <Link
          to="/"
          className="absolute top-2 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 md:top-4 z-50 flex-shrink-0 hover:opacity-80 transition-opacity animate-fade-in-up [animation-delay:0ms] opacity-0 fill-mode-forwards"
          aria-label="Adagio - Inicio"
        >
          <img src={logo} alt="Adagio Logo" className="h-12 sm:h-14 md:h-20 lg:h-24 w-auto" />
        </Link>

        {/* --- BARRA DE HERRAMIENTAS FLOTANTE --- */}
        <div className="fixed top-12 sm:top-14 md:top-6 left-0 right-0 z-40 flex justify-center px-2 md:px-4 animate-fade-in-up [animation-delay:100ms] opacity-0 fill-mode-forwards">
          <nav aria-label="Navegación principal" className="flex items-center gap-0.5 md:gap-2 px-1.5 md:px-3 py-1 md:py-2 bg-white/70 backdrop-blur-xl border border-white/50 rounded-full shadow-sm hover:shadow-md transition-all duration-300 w-auto max-w-[calc(100vw-1rem)] md:max-w-2xl">
            <div className="flex items-center gap-0.5 md:gap-1" role="tablist" aria-label="Secciones principales">
              <button
                role="tab"
                aria-selected={activeTab === "transcribe"}
                aria-current={activeTab === "transcribe" ? "page" : undefined}
                onClick={() => setActiveTab("transcribe")}
                className={`rounded-full px-2.5 md:px-6 py-1.5 md:py-3 text-xs md:text-base font-medium transition-all whitespace-nowrap
                              ${activeTab === "transcribe" ? "bg-white text-black shadow-sm" : "bg-transparent text-black/60 hover:bg-black/5 hover:text-black"}`}
              >
                Transcribir
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "train"}
                aria-current={activeTab === "train" ? "page" : undefined}
                onClick={() => setActiveTab("train")}
                className={`rounded-full px-2.5 md:px-6 py-1.5 md:py-3 text-xs md:text-base font-medium transition-all whitespace-nowrap
                              ${activeTab === "train" ? "bg-white text-black shadow-sm" : "bg-transparent text-black/60 hover:bg-black/5 hover:text-black"}`}
              >
                {isMobile ? "Entrenar" : "Entrenar Modelo"}
              </button>
              <button
                onClick={() => navigate("/colabora")}
                className="rounded-full px-2.5 md:px-6 py-1.5 md:py-3 text-xs md:text-base font-medium transition-all bg-transparent text-black/60 hover:bg-black/5 hover:text-black whitespace-nowrap"
              >
                {isMobile ? "Colaborar" : "Colabora con Adagio"}
              </button>
            </div>

            <div className="w-px h-4 md:h-6 bg-black/10 mx-0.5 md:mx-2" aria-hidden="true"></div>

            <div className="flex-shrink-0">
              {user ? (
                <UserMenu />
              ) : (
                !loading && (
                  <button
                    onClick={handleLoginClick}
                    aria-label="Iniciar sesión"
                    className="bg-[#005C64] text-white px-2.5 md:px-6 py-1.5 md:py-3 rounded-full font-semibold text-xs md:text-base flex items-center gap-1 md:gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md whitespace-nowrap"
                  >
                    <LogIn className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Iniciar sesión</span>
                    <span className="sm:hidden">Entrar</span>
                  </button>
                )
              )}
            </div>
          </nav>
        </div>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <main id="main-content" className="flex-1 pt-24 md:pt-40 pb-8 md:pb-20 px-3 md:px-8 max-w-7xl mx-auto w-full space-y-4 md:space-y-8">
          {/* Textos de Cabecera */}
          <div className="text-center space-y-2 md:space-y-4 animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards">
            <div className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-white/40 border border-[#005C64]/10 text-[#005C64] text-[9px] md:text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3" />
              <span>Privacidad Garantizada</span>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight">
              Tu voz, <span style={{ color: colors.primary }}>sin barreras.</span>
            </h1>
            <p className="text-xs md:text-lg opacity-60 max-w-xl mx-auto px-2">IA avanzada para el reconocimiento de habla atípica.</p>
          </div>

          {/* --- PANELES DE CRISTAL (Herramienta) --- */}
          <div className="w-full max-w-4xl mx-auto animate-fade-in-up [animation-delay:300ms] opacity-0 fill-mode-forwards">
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl md:rounded-[2.5rem] p-3 md:p-6 lg:p-10 shadow-sm min-h-[280px] md:min-h-[400px] relative overflow-hidden">
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-[#90C2E7]/20 rounded-full blur-3xl -z-10 pointer-events-none" />

              <TabsContent
                value="transcribe"
                className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500 focus-visible:outline-none"
              >
                <TranscribeView />
              </TabsContent>

              <TabsContent
                value="train"
                className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500 focus-visible:outline-none"
              >
                <TrainView />
              </TabsContent>
            </div>
          </div>

          {/* SECCIÓN INFERIOR ELIMINADA: Ya no hay tarjetas de Encriptación/Privacidad aquí */}
        </main>

        <div className="mt-auto relative z-10">
          <Footer />
        </div>
      </div>
    </Tabs>
  );
};

export default Index;
