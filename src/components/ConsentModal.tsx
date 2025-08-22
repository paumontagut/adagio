import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Shield, BarChart3, Users } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onConsentGiven: (analyticsConsent: boolean) => void;
}

export const ConsentModal = ({ isOpen, onConsentGiven }: ConsentModalProps) => {
  const [analyticsConsent, setAnalyticsConsent] = useState(true);

  const handleAccept = () => {
    onConsentGiven(analyticsConsent);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Consentimiento y Privacidad
          </DialogTitle>
          <DialogDescription>
            Antes de comenzar, necesitamos tu consentimiento para procesar tus grabaciones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data Usage */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Uso de Datos</h4>
                <p className="text-sm text-muted-foreground">
                  Tus grabaciones se utilizarán para mejorar el sistema de reconocimiento 
                  de voz de Adagio. Los datos se procesan de forma anónima y segura.
                </p>
              </div>
            </div>
          </Card>

          {/* Analytics Toggle */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-medium text-foreground">Estadísticas Anónimas</h4>
                  <p className="text-sm text-muted-foreground">
                    Ayúdanos a mejorar la aplicación compartiendo estadísticas de uso anónimas.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="analytics"
                    checked={analyticsConsent}
                    onCheckedChange={(checked) => setAnalyticsConsent(checked === true)}
                  />
                  <label 
                    htmlFor="analytics" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Compartir estadísticas anónimas de uso
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Privacy Summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Resumen de Privacidad:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Tus grabaciones se almacenan de forma anónima</li>
              <li>• No recopilamos información personal identificable</li>
              <li>• Puedes retirar tu consentimiento en cualquier momento</li>
              <li>• Las estadísticas son completamente anónimas (opcional)</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleAccept}
              className="flex-1"
              size="lg"
            >
              Acepto y continúo
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Al continuar, aceptas que tus grabaciones se utilicen para mejorar el sistema.
            Puedes cambiar tu preferencia sobre estadísticas anónimas en cualquier momento.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};