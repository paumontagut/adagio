import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Mail,
  ExternalLink
} from 'lucide-react';

export const GuestDataManager = () => {

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Gestión de Datos para Usuarios Invitados
        </h2>
        <p className="text-muted-foreground">
          Información sobre cómo solicitar la eliminación de tus datos personales
        </p>
      </div>

      {/* Main Information Card */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          
          <h3 className="text-xl font-semibold">Eliminación de Datos - Usuarios Invitados</h3>
          
          <div className="text-left space-y-4 max-w-lg mx-auto">
            <p className="text-muted-foreground">
              Si has grabado audio como usuario invitado y deseas que eliminemos tus datos, 
              debes contactarnos directamente por email proporcionando la documentación necesaria 
              para verificar tu identidad.
            </p>
            
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Contacto para eliminación de datos:</strong>
                <br />
                Email: <a 
                  href="mailto:hola@adagioweb.com" 
                  className="text-primary hover:text-primary/80 underline font-medium"
                >
                  hola@adagioweb.com
                </a>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <h4 className="font-medium">Información requerida en tu solicitud:</h4>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Tu nombre completo</li>
                <li>Email de contacto</li>
                <li>Fecha aproximada de las grabaciones</li>
                <li>Descripción del contenido grabado (si lo recuerdas)</li>
                <li>Cualquier información adicional que pueda ayudar a identificar tus datos</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Documentación de identidad necesaria:</h4>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Copia del DNI, NIE o documento de identidad válido</li>
                <li>Cualquier otra documentación que pueda ayudar a verificar tu identidad</li>
              </ul>
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Tiempo de respuesta:</strong> Procesaremos tu solicitud en un plazo máximo de 30 días 
                conforme al GDPR. Te notificaremos por email cuando el proceso esté completo.
              </AlertDescription>
            </Alert>

            <div className="text-center pt-4">
              <a
                href="mailto:hola@adagioweb.com?subject=Solicitud de eliminación de datos - Usuario invitado"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Mail className="h-4 w-4" />
                Enviar solicitud por email
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};