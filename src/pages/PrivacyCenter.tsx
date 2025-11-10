import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, FileText, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyCenter = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <Link to="/" className="inline-flex items-center text-foreground hover:text-foreground/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Adagio
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-foreground flex items-center justify-center gap-3">
              <Shield className="h-8 w-8" />
              Centro de Privacidad
            </h1>
            <p className="text-lg text-muted-foreground">
              Información sobre privacidad y protección de datos
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Overview Section */}
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información General
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">¿Qué datos recopilamos?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Grabaciones de audio (solo con tu consentimiento)</li>
                  <li>• Datos de sesión anónimos (ID de sesión, timestamps)</li>
                  <li>• Metadatos técnicos (calidad de audio, duración)</li>
                  <li>• Datos biométricos de voz (solo si consientes)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Tus derechos RGPD</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Derecho de acceso a tus datos</li>
                  <li>• Derecho de rectificación</li>
                  <li>• Derecho de supresión ("derecho al olvido")</li>
                  <li>• Derecho de portabilidad</li>
                  <li>• Derecho de oposición al tratamiento</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Information for Data Management */}
          <div className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold flex items-center justify-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Gestión de Datos y Privacidad
              </h2>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Gestión Personalizada de Datos:</strong>
                  <br />
                  Para cualquier consulta sobre tus datos, ejercer tus derechos RGPD, 
                  o gestionar tu privacidad, contacta directamente con nosotros.
                </AlertDescription>
              </Alert>
              
              <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">Correo de Contacto:</p>
                  <a 
                    href="mailto:hola@adagioweb.com" 
                    className="inline-flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/80 underline transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                    hola@adagioweb.com
                  </a>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>Solicitudes que puedes realizar:</strong>
                  </p>
                  <ul className="text-left max-w-md mx-auto space-y-1">
                    <li>• Acceso a tus datos personales</li>
                    <li>• Rectificación de información inexacta</li>
                    <li>• Portabilidad de tus datos</li>
                    <li>• Oposición o limitación del tratamiento</li>
                    <li>• Retirada de consentimientos</li>
                  </ul>
                  <p className="text-xs mt-2">
                    Todas las gestiones se realizan exclusivamente por correo en <strong>hola@adagioweb.com</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Information for Guests */}
          <div className="p-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Usuarios Invitados
              </h2>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>¿Grabaste como usuario invitado?</strong>
                  <br />
                  Si has realizado grabaciones sin registrarte y deseas gestionar tus datos, 
                  contacta a <strong>hola@adagioweb.com</strong> con tu documentación 
                  de identidad y detalles de las grabaciones.
                </AlertDescription>
              </Alert>
              
              <div className="text-sm space-y-2">
                <h3 className="font-medium">Para solicitar gestión de datos necesitarás:</h3>
                <ul className="text-muted-foreground space-y-1 ml-4">
                  <li>• Copia de DNI o documento de identidad</li>
                  <li>• Fecha aproximada de las grabaciones</li>
                  <li>• Descripción del contenido grabado</li>
                  <li>• Cualquier información adicional que ayude a identificar tus datos</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Procesaremos tu solicitud en un plazo máximo de 30 días conforme al GDPR.
                </p>
              </div>
            </div>
          </div>

          {/* Legal Information */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Información Legal
            </h2>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>
                <strong>Responsable del tratamiento:</strong> Adagio - hola@adagioweb.com
              </p>
              <p>
                <strong>Tiempo de procesamiento:</strong> Las solicitudes se procesan 
                en un máximo de 30 días según el Art. 12 RGPD.
              </p>
              <p>
                <strong>Confirmación:</strong> Recibirás confirmación por correo electrónico 
                de todas las acciones realizadas sobre tus datos.
              </p>
              <p>
                <strong>Autoridad de Control:</strong> Tienes derecho a presentar una reclamación 
                ante la Agencia Española de Protección de Datos (AEPD) si consideras que 
                se han vulnerado tus derechos.
              </p>
            </div>
          </div>

          {/* Link to other privacy pages */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Enlaces de Interés</h2>
            <div className="flex flex-wrap gap-4">
              <Link to="/privacy-policy" className="text-primary hover:text-primary/80 underline">
                Política de Privacidad
              </Link>
              <Link to="/terms-and-conditions" className="text-primary hover:text-primary/80 underline">
                Términos y Condiciones
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};