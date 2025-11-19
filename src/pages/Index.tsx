import { Shield, FileText, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full max-w-7xl mx-auto px-4 md:px-8 pb-8">
      {/* Contenedor "Dark Card" con bordes redondeados */}
      <div className="bg-[#0D0C1D] text-[#F5F8DE] rounded-[2.5rem] px-8 py-12 md:p-16 shadow-xl overflow-hidden relative">
        {/* Decoración de fondo sutil (Glow) */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#005C64] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Columna 1: Marca (Ocupa 5 columnas en desktop) */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-white">Adagio</span>
            </div>
            <p className="text-[#F5F8DE]/60 leading-relaxed max-w-md">
              Servicio de transcripción de audio inteligente y seguro, diseñado para la accesibilidad y con pleno
              cumplimiento del RGPD.
            </p>
          </div>

          {/* Columna 2: Legal (Ocupa 3 columnas) */}
          <div className="md:col-span-3 space-y-6">
            <h4 className="font-semibold text-white tracking-wide text-sm uppercase opacity-50">Legal</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/privacy-policy"
                  className="flex items-center gap-2 text-[#F5F8DE]/70 hover:text-white hover:translate-x-1 transition-all duration-300 group"
                >
                  <FileText className="w-4 h-4 text-[#005C64] group-hover:text-[#FFBC42] transition-colors" />
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="flex items-center gap-2 text-[#F5F8DE]/70 hover:text-white hover:translate-x-1 transition-all duration-300 group"
                >
                  <Shield className="w-4 h-4 text-[#005C64] group-hover:text-[#FFBC42] transition-colors" />
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Privacidad (Ocupa 4 columnas) */}
          <div className="md:col-span-4 space-y-6">
            <h4 className="font-semibold text-white tracking-wide text-sm uppercase opacity-50">Privacidad</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/privacy-center"
                  className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 hover:bg-white/10 transition-all w-full sm:w-auto group"
                >
                  <div className="bg-[#005C64] p-2 rounded-full group-hover:scale-110 transition-transform">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-white">Centro de Privacidad</span>
                    <span className="text-xs text-white/50">Gestiona tus datos</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria y Copyright */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#F5F8DE]/40">
          <p>© {currentYear} Adagio. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            {/* Redes sociales o enlaces extra si los tuvieras */}
            <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
            <span className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
