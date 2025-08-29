import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, ExternalLink, FileText, Database, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';
interface ConsentSectionProps {
  onConsentChange: (consentTrain: boolean, consentStore: boolean) => void;
  isValid: boolean;
}
export const ConsentSection = ({
  onConsentChange,
  isValid
}: ConsentSectionProps) => {
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
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-foreground">Consentimiento de Datos</h3>
            <p className="text-sm text-muted-foreground">
              Para continuar, debes aceptar ambas opciones de consentimiento
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/20">
            <Checkbox
              id="consent-train"
              checked={consentTrain}
              onCheckedChange={handleTrainConsentChange}
            />
            <div className="flex-1">
              <Label htmlFor="consent-train" className="text-sm font-medium cursor-pointer">
                Usar mi audio para entrenar el modelo de IA
                <span className="text-destructive ml-1">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Tu grabación se utilizará para mejorar el sistema de reconocimiento de voz
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/20">
            <Checkbox
              id="consent-store"
              checked={consentStore}
              onCheckedChange={handleStoreConsentChange}
            />
            <div className="flex-1">
              <Label htmlFor="consent-store" className="text-sm font-medium cursor-pointer">
                Almacenar mi audio de forma segura
                <span className="text-destructive ml-1">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Tu audio se guardará cifrado en nuestros servidores seguros
              </p>
            </div>
          </div>
        </div>

        {!isValid && (
          <Alert>
            <AlertDescription>
              Debes aceptar ambas opciones de consentimiento para continuar
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>
            Al continuar, aceptas nuestros{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Términos y Condiciones
            </Link>{' '}
            y{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Política de Privacidad
            </Link>
          </span>
        </div>
      </div>
    </Card>
  );
};