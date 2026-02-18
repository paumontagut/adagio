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
        <div 
          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer select-none"
          onClick={() => handleTrainConsentChange(!consentTrain)}
          role="checkbox"
          aria-checked={consentTrain}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleTrainConsentChange(!consentTrain); } }}
        >
          <Checkbox
            id="consent-train"
            checked={consentTrain}
            onCheckedChange={handleTrainConsentChange}
            aria-describedby="consent-train-desc"
            className="pointer-events-none"
            tabIndex={-1}
          />
          <div className="space-y-1">
            <span className="font-medium text-sm">
              Autorizo el uso de mis datos para entrenamiento
            </span>
            <p id="consent-train-desc" className="text-sm text-muted-foreground">
              Consulta la <Link to="/privacy-policy" className="underline" onClick={(e) => e.stopPropagation()}>Política de Privacidad</Link> y los
              <Link to="/terms-and-conditions" className="underline ml-1" onClick={(e) => e.stopPropagation()}>Términos y Condiciones</Link>.
            </p>
          </div>
        </div>

        <div 
          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer select-none"
          onClick={() => handleStoreConsentChange(!consentStore)}
          role="checkbox"
          aria-checked={consentStore}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleStoreConsentChange(!consentStore); } }}
        >
          <Checkbox
            id="consent-store"
            checked={consentStore}
            onCheckedChange={handleStoreConsentChange}
            aria-describedby="consent-store-desc"
            className="pointer-events-none"
            tabIndex={-1}
          />
          <div className="space-y-1">
            <span className="font-medium text-sm">
              Autorizo el almacenamiento cifrado de mi audio
            </span>
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
