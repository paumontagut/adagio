import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
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

  const handleTrainConsentChange = (checked: boolean | 'indeterminate') => {
    const value = checked === true;
    setConsentTrain(value);
    onConsentChange(value, consentStore);
  };

  const handleStoreConsentChange = (checked: boolean | 'indeterminate') => {
    const value = checked === true;
    setConsentStore(value);
    onConsentChange(consentTrain, value);
  };

  return (
    <section aria-labelledby="consent-section-title">
      <Card className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent-train"
            checked={consentTrain}
            onCheckedChange={handleTrainConsentChange}
            aria-describedby="consent-train-desc"
          />
          <div className="space-y-1">
            <Label htmlFor="consent-train" className="font-medium">
              Autorizo el uso de mis datos para entrenamiento
            </Label>
            <p id="consent-train-desc" className="text-sm text-muted-foreground">
              Consulta la <Link to="/privacy-policy" className="underline">Política de Privacidad</Link> y los
              <Link to="/terms-and-conditions" className="underline ml-1">Términos y Condiciones</Link>.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="consent-store"
            checked={consentStore}
            onCheckedChange={handleStoreConsentChange}
            aria-describedby="consent-store-desc"
          />
          <div className="space-y-1">
            <Label htmlFor="consent-store" className="font-medium">
              Autorizo el almacenamiento cifrado de mi audio
            </Label>
            <p id="consent-store-desc" className="text-sm text-muted-foreground">
              Tus datos se almacenarán de forma segura y conforme a la normativa.
            </p>
          </div>
        </div>

        {!isValid && (
          <Alert variant="destructive">
            <AlertDescription>
              Debes aceptar ambos consentimientos para continuar.
            </AlertDescription>
          </Alert>
        )}
      </Card>
    </section>
  );
};
