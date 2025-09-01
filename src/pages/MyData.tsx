import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, Mail, FileText, HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyData = () => {
  return <div className="min-h-screen bg-[#005c64]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <Link to="/" className="inline-flex items-center text-white hover:text-white/90 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Adagio
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-white flex items-center justify-center gap-3">
              <HardDrive className="h-8 w-8" />
              Tus Datos
            </h1>
            <p className="text-lg text-white">
              Información sobre tus datos y derechos RGPD
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Data Rights Information */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tus Derechos de Datos
            </h2>
            <div className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <strong>Gestión de Datos Personalizada:</strong>
                  <br />
                  Para cualquier consulta sobre tus datos, solicitud de descarga, 
                  modificación o eliminación, por favor contacta directamente con nosotros.
                </AlertDescription>
              </Alert>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2 text-primary">Derecho de Acceso</h3>
                  <p className="text-sm text-muted-foreground">
                    Puedes solicitar información sobre qué datos personales procesamos,
                    cómo los utilizamos y con quién los compartimos.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2 text-primary">Derecho de Portabilidad</h3>
                  <p className="text-sm text-muted-foreground">
                    Puedes solicitar una copia de tus datos en formato estructurado,
                    incluyendo grabaciones cifradas, metadatos y registros de consentimiento.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2 text-destructive">Derecho al Olvido</h3>
                  <p className="text-sm text-muted-foreground">
                    Puedes solicitar la eliminación completa y permanente de todos
                    tus datos de nuestros sistemas, incluyendo backups.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2 text-primary">Derecho de Rectificación</h3>
                  <p className="text-sm text-muted-foreground">
                    Puedes solicitar la corrección de datos personales inexactos
                    o incompletos que tengamos sobre ti.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contacto para Gestión de Datos
              </h3>
              <p className="text-muted-foreground mb-4">
                Para ejercer cualquiera de tus derechos o realizar consultas sobre tus datos:
              </p>
              
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
                    <strong>Incluye en tu mensaje:</strong>
                  </p>
                  <ul className="text-left max-w-md mx-auto space-y-1">
                    <li>• Tu nombre completo</li>
                    <li>• El tipo de solicitud (acceso, descarga, eliminación, etc.)</li>
                    <li>• Cualquier información relevante sobre tus grabaciones</li>
                    <li>• Fechas aproximadas de uso del servicio</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Legal Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Información Legal
            </h2>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>
                <strong>Tiempo de procesamiento:</strong> Las solicitudes se procesan 
                en un máximo de 30 días según el Art. 12 RGPD.
              </p>
              <p>
                <strong>Confirmación:</strong> Recibirás confirmación por correo electrónico 
                de todas las acciones realizadas sobre tus datos.
              </p>
              <p>
                <strong>Contacto DPO:</strong> Para consultas específicas sobre protección de datos, 
                contacta con nuestro equipo en <strong>hola@adagioweb.com</strong>
              </p>
              <p>
                <strong>Autoridad de Control:</strong> Tienes derecho a presentar una reclamación 
                ante la Agencia Española de Protección de Datos (AEPD) si consideras que 
                se han vulnerado tus derechos.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>;
};