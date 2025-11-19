import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscribeView } from "@/components/TranscribeView";
import { TrainView } from "@/components/TrainView";
import { Footer } from "@/components/Footer";
import { AuthButton } from "@/components/AuthButton";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { HardDrive, ShieldCheck, ArrowRight, Mic, Database } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import logo from "@/assets/logo.svg";

// Definimos los colores de marca para usarlos en estilos inline si es necesario
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

  // Lógica original: Manejar parámetros de URL para cambiar pestañas
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "train" || tabParam === "transcribe") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <div
      className="min-h-screen w-full font-sans selection:bg-[#005C64] selection:text-white flex flex-col"
      style={{ backgroundColor: colors.bg, color: colors.dark }}
    >
      {/* Enlaces de accesibilidad (importante mantenerlos) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-black text-white p-4 rounded-lg z-[100]"
      >
        Saltar al contenido principal
      </a>

      {/* --- NAVBAR FLOTANTE (Isla Dinámica) --- */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 animate-fade-in-up">
        <nav className="flex items-center gap-4 sm:gap-8 px-3 py-2 sm:px-6 sm:py-3 bg-white/60 backdrop-blur-xl border border-white/50 rounded-full shadow-sm hover:shadow-md transition-all duration-300 max-w-full overflow-x-auto">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 mr-2">
            {/* Si tienes el SVG úsalo, si no, un texto elegante */}
            <img src={logo} alt="Adagio Logo" className="h-8 w-8 sm:h-10 sm:w-auto" />
            <span className="font-bold tracking-tight text-lg hidden sm:block">Adagio</span>
          </Link>

          {/* Menú Central - Enlaces rápidos */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium opacity-80">
            <Link to="/privacy-center" className="hover:text-[#005C64] transition-colors">
              Privacidad
            </Link>
            {user && (
              <Link to="/my-data" className="hover:text-[#005C64] transition-colors flex items-center gap-1">
                <Database className="w-3 h-3" /> Mis Datos
              </Link>
            )}
          </div>

          <div className="h-4 w-[1px] bg-black/10 hidden sm:block"></div>

          {/* Área de Usuario (Auth) */}
          <div className="flex items-center gap-2">{user ? <UserMenu /> : !loading && <AuthButton />}</div>
        </nav>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main id="main-content" className="flex-1 pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full space-y-12">
        {/* CABECERA: Título y descripción */}
        <div className="text-center space-y-4 animate-fade-in-up [animation-delay:100ms] opacity-0 fill-mode-forwards">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 border border-[#005C64]/10 text-[#005C64] text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-3 h-3" />
            <span>Privacidad Garantizada</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Tu voz, <span style={{ color: colors.primary }}>sin barreras.</span>
          </h1>
          <p className="text-lg opacity-60 max-w-xl mx-auto">
            IA avanzada para el reconocimiento de habla atípica. Seguro, privado y diseñado para ti.
          </p>
        </div>

        {/* --- HERRAMIENTA PRINCIPAL (Glass Panel) --- */}
        {/* Aquí envolvemos tu funcionalidad original en el nuevo diseño */}
        <div className="animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              setSearchParams({ tab: value });
            }}
            className="w-full max-w-4xl mx-auto"
          >
            {/* Pestañas estilo iOS Segmented Control */}
            <div className="flex justify-center mb-8">
              <TabsList className="bg-black/5 backdrop-blur-sm p-1.5 rounded-full h-auto inline-flex">
                <TabsTrigger
                  value="transcribe"
                  className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Transcribir
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="train"
                  className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Entrenar Modelo
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Contenedor de Cristal para la vista activa */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-6 md:p-10 shadow-sm min-h-[400px] relative overflow-hidden">
              {/* Decoración de fondo sutil */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#90C2E7]/20 rounded-full blur-3xl -z-10 pointer-events-none" />

              <TabsContent
                value="transcribe"
                className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500"
              >
                <TranscribeView />
              </TabsContent>

              <TabsContent value="train" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                <TrainView />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* --- BENTO GRID (Información extra abajo) --- */}
        {/* Mantenemos esto para dar contexto si el usuario hace scroll */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 opacity-80 hover:opacity-100 transition-opacity">
          <div className="md:col-span-2 bg-white/40 rounded-[2rem] p-8 border border-white/30 hover:bg-white/60 transition-colors">
            <h3 className="text-xl font-bold mb-2">Encriptación AES-256</h3>
            <p className="opacity-70 text-sm">
              Tus grabaciones se encriptan en tu dispositivo antes de enviarse. Solo tú tienes la llave.
            </p>
          </div>
          <Link
            to="/privacy-center"
            className="bg-[#0D0C1D] rounded-[2rem] p-8 text-[#F5F8DE] flex flex-col justify-between group hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <ShieldCheck className="w-8 h-8" />
              <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </div>
            <div>
              <h3 className="font-bold mt-4">Centro de Privacidad</h3>
              <p className="text-xs opacity-60 mt-1">Controla tus datos</p>
            </div>
          </Link>
        </section>
      </main>

      <div className="mt-auto relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
