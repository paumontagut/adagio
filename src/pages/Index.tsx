import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TranscribeView } from "@/components/TranscribeView";
import { TrainView } from "@/components/TrainView";
import { Footer } from "@/components/Footer";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, ArrowRight, LogIn } from "lucide-react"; // Quitamos Mic y Database de los imports
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.svg";

const colors = {
  bg: "#F5F8DE", // Crema
  primary: "#005C64", // Teal
  dark: "#0D0C1D", // Negro Suave
  accent: "#FFBC42", // Amarillo
  blue: "#90C2E7", // Azulito
};

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("transcribe");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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

        {/* --- LOGO GIGANTE (x3) --- */}
        <Link
          to="/"
          className="fixed top-6 left-8 z-50 flex-shrink-0 hover:opacity-80 transition-opacity animate-fade-in-up [animation-delay:0ms] opacity-0 fill-mode-forwards"
        >
          {/* Clases h-32 md:h-40 para tamaño masivo */}
          <img src={logo} alt="Adagio Logo" className="h-32 md:h-40 w-auto" />
        </Link>

        {/* --- BARRA DE HERRAMIENTAS FLOTANTE --- */}
        <div className="fixed top-8 left-0 right-0 z-40 flex justify-center px-4 animate-fade-in-up [animation-delay:100ms] opacity-0 fill-mode-forwards">
          <nav className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-xl border border-white/50 rounded-full shadow-sm hover:shadow-md transition-all duration-300 w-full max-w-lg justify-between">
            {/* Controles de Transcribir/Entrenar (Solo Texto) */}
            <div className="flex justify-center gap-1">
              <button
                onClick={() => setActiveTab("transcribe")}
                className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all 
                              ${activeTab === "transcribe" ? "bg-white text-black shadow-sm" : "bg-transparent text-black/60 hover:bg-black/5"}`}
              >
                Transcribir
              </button>
              <button
                onClick={() => setActiveTab("train")}
                className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all 
                              ${activeTab === "train" ? "bg-white text-black shadow-sm" : "bg-transparent text-black/60 hover:bg-black/5"}`}
              >
                Entrenar Modelo
              </button>
            </div>

            {/* Botón Login (Azulito) */}
            <div className="flex-shrink-0 pl-2">
              {user ? (
                <UserMenu />
              ) : (
                !loading && (
                  <button
                    onClick={handleLoginClick}
                    className="px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm"
                    style={{ backgroundColor: colors.blue, color: colors.dark }}
                  >
                    <LogIn className="w-4 h-4" />
                    Iniciar sesión
                  </button>
                )
              )}
            </div>
          </nav>
        </div>

        {/* --- CONTENIDO PRINCIPAL --- */}
        {/* Aumentado pt-48 para dar aire respecto al logo y la barra */}
        <main id="main-content" className="flex-1 pt-48 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full space-y-8">
          <div className="text-center space-y-4 animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 border border-[#005C64]/10 text-[#005C64] text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-3 h-3" />
              <span>Privacidad Garantizada</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Tu voz, <span style={{ color: colors.primary }}>sin barreras.</span>
            </h1>
            <p className="text-lg opacity-60 max-w-xl mx-auto">IA avanzada para el reconocimiento de habla atípica.</p>
          </div>

          {/* VISTAS (Paneles de Cristal) */}
          <div className="w-full max-w-4xl mx-auto animate-fade-in-up [animation-delay:300ms] opacity-0 fill-mode-forwards">
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-6 md:p-10 shadow-sm min-h-[400px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#90C2E7]/20 rounded-full blur-3xl -z-10 pointer-events-none" />

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

          {/* Footer Bento Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 opacity-80 hover:opacity-100 transition-opacity max-w-4xl mx-auto">
            <div className="md:col-span-2 bg-white/40 rounded-[2rem] p-6 border border-white/30 hover:bg-white/60 transition-colors">
              <h3 className="text-lg font-bold mb-1">Encriptación Local</h3>
              <p className="opacity-70 text-sm">Tus datos se protegen antes de salir de tu dispositivo.</p>
            </div>
            <Link
              to="/privacy-center"
              className="bg-[#0D0C1D] rounded-[2rem] p-6 text-[#F5F8DE] flex flex-col justify-between group hover:scale-[1.02] transition-transform cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <ShieldCheck className="w-6 h-6" />
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </div>
              <div>
                <h3 className="font-bold mt-2 text-sm">Centro de Privacidad</h3>
              </div>
            </Link>
          </section>
        </main>

        <div className="mt-auto relative z-10">
          <Footer />
        </div>
      </div>
    </Tabs>
  );
};

export default Index;
