import { Link } from "react-router-dom";
import { Shield, Scale, Database, FileText } from "lucide-react";
export const Footer = () => {
  return <footer className="bg-adagio-primary text-white border-t border-adagio-primary-hover">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Adagio</h3>
            <p className="text-sm text-white/80">
              Servicio de transcripción de audio inteligente y seguro, 
              con pleno cumplimiento del RGPD.
            </p>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <nav className="space-y-2">
              <Link to="/privacy-policy" className="flex items-center gap-2 text-sm text-white/80 hover:text-adagio-accent hover:underline transition-colors">
                <Shield className="h-3 w-3" />
                Política de Privacidad
              </Link>
              <Link to="/terms-and-conditions" className="flex items-center gap-2 text-sm text-white/80 hover:text-adagio-accent hover:underline transition-colors">
                <Scale className="h-3 w-3" />
                Términos y Condiciones
              </Link>
            </nav>
          </div>

          {/* Privacy Controls */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white">Privacidad</h4>
            <nav className="space-y-2">
              <Link to="/privacy-center" className="flex items-center gap-2 text-sm text-white/80 hover:text-adagio-accent hover:underline transition-colors">
                <Shield className="h-3 w-3" />
                Centro de Privacidad
              </Link>
              
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/70">
              © {new Date().getFullYear()} Adagio. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-1 text-xs text-white/70">
              <FileText className="h-3 w-3" />
              Cumplimiento RGPD
            </div>
          </div>
        </div>
      </div>
    </footer>;
};