import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Info, ExternalLink, User, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';
import { setParticipantName } from '@/lib/participant';

interface TrainingConsentModalProps {
  isOpen: boolean;
  onConsentGiven: (consentTrain: boolean, fullName: string, ageRange: string, region: string) => void;
  onCancel?: () => void;
}

export const TrainingConsentModal = ({ isOpen, onConsentGiven, onCancel }: TrainingConsentModalProps) => {
  const navigate = useNavigate();
  const [consentTrain, setConsentTrain] = useState(false);
  const [fullName, setFullName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [region, setRegion] = useState('');

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Default behavior: navigate to home page with transcribe tab
      navigate('/?tab=transcribe');
    }
  };

  const handleAccept = () => {
    if (consentTrain && fullName.trim() && ageRange && region) {
      // Persistir el nombre del participante
      setParticipantName(fullName.trim());
      onConsentGiven(consentTrain, fullName.trim(), ageRange, region);
    }
  };

  const isValid = consentTrain && fullName.trim() && ageRange && region;

  return (
    <Dialog open={isOpen} modal onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-adagio-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-adagio-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Consentimiento y Privacidad - Entrenamiento
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Antes de comenzar a grabar, necesitamos tu consentimiento explícito
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Biometric Data Warning */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Tu voz es un dato biométrico</strong> que puede contener información sanitaria implícita. 
              Este procesamiento requiere tu consentimiento explícito según el RGPD (Art. 9).
            </AlertDescription>
          </Alert>

          {/* Consent Options */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 border-2 border-adagio-primary/30 rounded-lg hover:bg-muted/30 transition-colors bg-adagio-primary/5">
              <Checkbox
                id="consent-train"
                checked={consentTrain}
                onCheckedChange={(checked) => setConsentTrain(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="consent-train" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  Usar mi audio para entrenar el modelo de IA
                  <span className="text-xs bg-adagio-primary text-white px-2 py-1 rounded-full">OBLIGATORIO</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Tu voz será utilizada para mejorar la precisión del reconocimiento de voz mediante 
                  técnicas de aprendizaje automático. Los datos se procesarán de forma pseudonimizada.
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information Fields */}
          <div className="space-y-4">
            {/* Full Name Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-adagio-primary" />
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Nombre completo <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="fullName"
                type="text"
                placeholder="Ingresa tu nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Tu nombre será asociado con las grabaciones para fines de entrenamiento
              </p>
            </div>

            {/* Age Range Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-adagio-primary" />
                <Label htmlFor="ageRange" className="text-sm font-medium">
                  Rango de edad <span className="text-destructive">*</span>
                </Label>
              </div>
              <Select value={ageRange} onValueChange={setAgeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu rango de edad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14-17">14–17 años (con autorización parental)</SelectItem>
                  <SelectItem value="18-25">18–25 años</SelectItem>
                  <SelectItem value="26-35">26–35 años</SelectItem>
                  <SelectItem value="36-45">36–45 años</SelectItem>
                  <SelectItem value="46-60">46–60 años</SelectItem>
                  <SelectItem value="61+">61+ años</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Los rangos de edad ayudan a mejorar la precisión del modelo
              </p>
            </div>

            {/* Region Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-adagio-primary" />
                <Label htmlFor="region" className="text-sm font-medium">
                  Región <span className="text-destructive">*</span>
                </Label>
              </div>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu región" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="andalucia">Andalucía</SelectItem>
                  <SelectItem value="aragon">Aragón</SelectItem>
                  <SelectItem value="asturias">Asturias</SelectItem>
                  <SelectItem value="baleares">Islas Baleares</SelectItem>
                  <SelectItem value="canarias">Islas Canarias</SelectItem>
                  <SelectItem value="cantabria">Cantabria</SelectItem>
                  <SelectItem value="castilla-la-mancha">Castilla-La Mancha</SelectItem>
                  <SelectItem value="castilla-leon">Castilla y León</SelectItem>
                  <SelectItem value="cataluna">Cataluña</SelectItem>
                  <SelectItem value="extremadura">Extremadura</SelectItem>
                  <SelectItem value="galicia">Galicia</SelectItem>
                  <SelectItem value="madrid">Comunidad de Madrid</SelectItem>
                  <SelectItem value="murcia">Región de Murcia</SelectItem>
                  <SelectItem value="navarra">Navarra</SelectItem>
                  <SelectItem value="pais-vasco">País Vasco</SelectItem>
                  <SelectItem value="rioja">La Rioja</SelectItem>
                  <SelectItem value="valencia">Comunidad Valenciana</SelectItem>
                  <SelectItem value="ceuta">Ceuta</SelectItem>
                  <SelectItem value="melilla">Melilla</SelectItem>
                  <SelectItem value="otro-pais">Otro país</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                La región ayuda a mejorar el reconocimiento de acentos y variaciones dialectales
              </p>
            </div>
          </div>

          {/* Validation Error */}
          {!isValid && (
            <Alert variant="destructive">
              <AlertDescription>
                Debes aceptar el consentimiento y completar todos los campos obligatorios para continuar.
              </AlertDescription>
            </Alert>
          )}

          {/* Legal Information */}
          <div className="text-xs text-muted-foreground space-y-2 p-4 bg-muted/30 rounded-lg">
            <p><strong>Información RGPD:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• <strong>Responsable:</strong> Adagio (hola@adagioweb.com)</li>
              <li>• <strong>Finalidad:</strong> Entrenamiento de modelos de IA y mejora del servicio</li>
              <li>• <strong>Base legal:</strong> Consentimiento explícito (Art. 6.1.a y 9.2.a RGPD)</li>
              <li>• <strong>Conservación:</strong> Hasta revocación del consentimiento</li>
              <li>• <strong>Destinatarios:</strong> No se ceden a terceros</li>
              <li>• <strong>Derechos:</strong> Acceso, rectificación, supresión, portabilidad y oposición</li>
            </ul>
            
            <div className="flex flex-wrap gap-4 mt-3 pt-2 border-t border-border/50">
              <Link to="/my-data" className="text-adagio-primary hover:text-adagio-accent text-xs flex items-center gap-1">
                Mis Datos <ExternalLink className="h-3 w-3" />
              </Link>
              <Link to="/privacy-center" className="text-adagio-primary hover:text-adagio-accent text-xs flex items-center gap-1">
                Centro de Privacidad <ExternalLink className="h-3 w-3" />
              </Link>
              <Link to="/privacy-policy" className="text-adagio-primary hover:text-adagio-accent text-xs flex items-center gap-1">
                Política de Privacidad <ExternalLink className="h-3 w-3" />
              </Link>
              <Link to="/terms" className="text-adagio-primary hover:text-adagio-accent text-xs flex items-center gap-1">
                Términos y Condiciones <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 gap-3">
            <Button 
              variant="outline"
              onClick={handleCancel}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAccept} 
              disabled={!isValid}
              className="flex-1 sm:flex-none"
            >
              <Shield className="mr-2 h-4 w-4" />
              Acepto y quiero continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};