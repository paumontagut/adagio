import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AudioLines, ArrowLeft, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import logo from "@/assets/logo.svg";

export const MyData = () => {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col selection:bg-primary/20">
      {/* Header Simplificado */}
      <header className="w-full py-4 md:py-6 px-3 sm:px-4 md:px-8 animate-fade-in-up [animation-delay:0ms] opacity-0 fill-mode-forwards">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src={logo} alt="Adagio" className="h-10 md:h-12 lg:h-16 w-auto" />
          </Link>

          <Button
            variant="ghost"
            asChild
            className="hover:bg-primary/5 text-foreground/80 hover:text-primary rounded-full px-3 md:px-6 text-xs md:text-sm"
          >
            <Link to="/">
              <ArrowLeft className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Volver al inicio</span>
              <span className="sm:hidden">Volver</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-3 md:px-8 py-8 md:py-12 w-full max-w-7xl mx-auto">
        {/* Título de sección con animación */}
        <div className="text-center space-y-3 md:space-y-4 mb-6 md:mb-10 animate-fade-in-up [animation-delay:100ms] opacity-0 fill-mode-forwards">
          <div className="inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 rounded-full bg-white/40 border border-primary/10 text-primary text-[10px] md:text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3" />
            <span>Privacidad y Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">Tus Datos</h1>
        </div>

        {/* TARJETA ESTILO "GLASS" */}
        <div className="w-full max-w-3xl animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards">
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 lg:p-16 shadow-sm relative overflow-hidden text-center">
            {/* Decoración de fondo sutil */}
            <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-secondary/20 rounded-full blur-3xl -z-10 pointer-events-none" />

            {/* Icono central */}
            <div className="mb-6 md:mb-8 flex justify-center">
              <div className="p-4 md:p-6 rounded-full bg-white/50 border border-white/60 shadow-sm">
                <AudioLines className="h-8 w-8 md:h-12 md:w-12 text-primary opacity-80" />
              </div>
            </div>

            {/* Subtítulo */}
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 md:mb-4">Próximamente disponible</h2>

            {/* Texto descriptivo */}
            <p className="text-muted-foreground text-sm md:text-lg leading-relaxed max-w-xl mx-auto mb-6 md:mb-10 px-2">
              Estamos preparando el panel donde podrás gestionar todo tu historial de{" "}
              <span className="text-foreground font-medium">transcripciones</span> y{" "}
              <span className="text-foreground font-medium">traducciones</span>. Tendrás control total para descargar o
              eliminar tu información cuando quieras.
            </p>

            {/* Botón de acción principal */}
            <Button
              size="lg"
              className="rounded-full px-6 md:px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-sm md:text-base"
              asChild
            >
              <Link to="/">Volver al Dashboard</Link>
            </Button>
          </div>
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};
