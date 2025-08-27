import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink, FileText, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ConsentSectionProps {
  onConsentChange: (consentTrain: boolean, consentStore: boolean) => void;
  isValid: boolean;
}

export const ConsentSection = ({ onConsentChange, isValid }: ConsentSectionProps) => {
  const [consentTrain, setConsentTrain] = useState(false);
  const [consentStore, setConsentStore] = useState(false);

  const handleTrainConsentChange = (checked: boolean) => {
    setConsentTrain(checked);
    onConsentChange(checked, consentStore);
  };

  const handleStoreConsentChange = (checked: boolean) => {
    setConsentStore(checked);
    onConsentChange(consentTrain, checked);
  };

  return (
    <Card className="p-6 border-primary/20">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">
            Consentimiento y Privacidad
          </h3>
        </div>

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>Información sobre Datos Biométricos:</strong> Tu grabación de voz puede contener 
            características biométricas únicas. Estos datos son especialmente protegidos bajo el RGPD 
            y requieren tu consentimiento explícito.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="consent-train" 
                checked={consentTrain}
                onCheckedChange={handleTrainConsentChange}
              />
              <div className="space-y-1">
                <label htmlFor="consent-train" className="text-sm font-medium text-foreground cursor-pointer">
                  Usar mi audio para entrenar el modelo
                </label>
                <p className="text-xs text-muted-foreground">
                  Autorizo el uso de esta grabación para mejorar el sistema de reconocimiento de voz. 
                  Los datos se procesarán de forma anónima y segura para entrenar algoritmos de IA.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="consent-store" 
                checked={consentStore}
                onCheckedChange={handleStoreConsentChange}
              />
              <div className="space-y-1">
                <label htmlFor="consent-store" className="text-sm font-medium text-foreground cursor-pointer">
                  Guardar mi audio en mi cuenta
                </label>
                <p className="text-xs text-muted-foreground">
                  Autorizo el almacenamiento de esta grabación en mi perfil para futuras consultas 
                  y mejoras personalizadas del servicio.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!isValid && (
          <Alert variant="destructive">
            <AlertDescription>
              Debes seleccionar al menos una opción para continuar.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Información Legal (RGPD Art. 13)</span>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              <strong>Responsable:</strong> Adagio • <strong>Finalidad:</strong> Entrenamiento de IA y mejora del servicio
            </p>
            <p>
              <strong>Base legal:</strong> Consentimiento explícito (Art. 6.1.a y 9.2.a RGPD) • 
              <strong>Conservación:</strong> Hasta retirada del consentimiento
            </p>
            <p>
              <strong>Destinatarios:</strong> No se ceden datos a terceros • 
              <strong>Derechos:</strong> Acceso, rectificación, supresión, oposición, portabilidad
            </p>
            
            <div className="pt-2 flex flex-wrap gap-3">
              <Link 
                to="/privacy-center" 
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline"
              >
                <Shield className="h-3 w-3" />
                Centro de Privacidad
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                Política de Privacidad
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                Información Biométrica
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};