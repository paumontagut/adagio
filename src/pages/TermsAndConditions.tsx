
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, FileText, Shield, Clock, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Términos y Condiciones
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Servicio de Transcripción Adagio
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </p>
        </div>

        <div className="space-y-8">
          {/* Aceptación de Términos */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              1. Aceptación de Términos
            </h2>
            <div className="space-y-4">
              <p>
                Al utilizar el servicio de transcripción de Adagio ("el Servicio"), usted acepta 
                estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con estos 
                términos, no utilice el Servicio.
              </p>
              <p>
                Estos términos constituyen un acuerdo legal vinculante entre usted y Adagio 
                respecto al uso del Servicio de transcripción de audio a texto.
              </p>
            </div>
          </div>

          {/* Descripción del Servicio */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              2. Descripción del Servicio
            </h2>
            <div className="space-y-4">
              <p>
                Adagio proporciona un servicio de transcripción que convierte grabaciones de 
                audio en texto utilizando tecnología de inteligencia artificial y aprendizaje 
                automático.
              </p>
              <p>El Servicio incluye:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Transcripción de audio a texto en tiempo real</li>
                <li>Soporte para múltiples formatos de audio (WAV, MP3, WebM)</li>
                <li>Procesamiento local y seguro de datos de audio</li>
                <li>Funciones de mejora continua del modelo de IA</li>
              </ul>
            </div>
          </div>

          {/* Uso Aceptable */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              3. Uso Aceptable
            </h2>
            <div className="space-y-4">
              <p>Usted se compromete a utilizar el Servicio únicamente para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Transcribir contenido de audio legítimo y legal</li>
                <li>Fines personales, académicos o comerciales legales</li>
                <li>Contenido del cual posee los derechos o autorización</li>
              </ul>
              
              <p>Está prohibido el uso del Servicio para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Transcribir contenido ilegal, difamatorio o que infrinja derechos de terceros</li>
                <li>Procesar grabaciones obtenidas sin consentimiento apropiado</li>
                <li>Generar contenido que viole normativas de privacidad o protección de datos</li>
                <li>Sobrecargar o intentar comprometer la seguridad del sistema</li>
              </ul>
            </div>
          </div>

          {/* Privacidad y Datos */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              4. Privacidad y Protección de Datos
            </h2>
            <div className="space-y-4">
              <p>
                El tratamiento de sus datos personales y grabaciones de audio se rige por 
                nuestra <Link to="/privacy-policy" className="text-primary hover:underline">
                Política de Privacidad</Link>, que forma parte integral de estos Términos.
              </p>
              <p>
                Sus grabaciones pueden contener datos biométricos, que reciben protección 
                especial bajo el RGPD. Requerimos su consentimiento explícito para procesar 
                estos datos según se describe en la Política de Privacidad.
              </p>
            </div>
          </div>

          {/* Limitaciones de Responsabilidad */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              5. Limitaciones de Responsabilidad
            </h2>
            <div className="space-y-4">
              <p>
                El Servicio se proporciona "tal como está". No garantizamos la exactitud 
                absoluta de las transcripciones, ya que dependen de la calidad del audio 
                y las limitaciones de la tecnología de IA.
              </p>
              <p>
                Adagio no será responsable por daños directos, indirectos, incidentales 
                o consecuentes derivados del uso del Servicio, incluyendo pero no limitado a:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Inexactitudes en las transcripciones</li>
                <li>Pérdida de datos o contenido</li>
                <li>Interrupciones del servicio</li>
                <li>Decisiones tomadas basándose en las transcripciones</li>
              </ul>
            </div>
          </div>

          {/* Modificaciones */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              6. Modificaciones de los Términos
            </h2>
            <div className="space-y-4">
              <p>
                Nos reservamos el derecho de modificar estos Términos y Condiciones en 
                cualquier momento. Las modificaciones entrarán en vigor inmediatamente 
                tras su publicación en esta página.
              </p>
              <p>
                Es su responsabilidad revisar periódicamente estos términos. El uso 
                continuado del Servicio después de las modificaciones constituye 
                aceptación de los nuevos términos.
              </p>
            </div>
          </div>

          {/* Jurisdicción */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              7. Jurisdicción y Ley Aplicable
            </h2>
            <div className="space-y-4">
              <p>
                Estos Términos y Condiciones se rigen por las leyes españolas y europeas, 
                incluyendo el Reglamento General de Protección de Datos (RGPD).
              </p>
              <p>
                Cualquier disputa relacionada con estos términos será sometida a la 
                jurisdicción exclusiva de los tribunales españoles competentes.
              </p>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              8. Contacto
            </h2>
            <div className="space-y-4">
              <p>
                Para preguntas sobre estos Términos y Condiciones o sobre el Servicio, 
                puede contactarnos a través de nuestro <Link to="/privacy-center" 
                className="text-primary hover:underline">Centro de Privacidad</Link>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
            <div className="flex gap-4">
              <Link to="/privacy-policy">
                <Button variant="link">
                  Política de Privacidad
                </Button>
              </Link>
              <Link to="/privacy-center">
                <Button variant="link">
                  Centro de Privacidad
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};