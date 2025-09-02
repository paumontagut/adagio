import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Info, ExternalLink, User, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateSessionId, getStoredConsent, storeConsent } from "@/lib/session";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ConsentGateProps {
  onReady: (fullName: string, consentAt: string) => void;
}

export const ConsentGate = ({ onReady }: ConsentGateProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [consentTrain, setConsentTrain] = useState(true);
  const [consentStore, setConsentStore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);

  useEffect(() => {
    checkExistingConsent();
  }, [user]);

  const checkExistingConsent = async () => {
    try {
      // First check localStorage
      const storedConsent = getStoredConsent();
      
      if (storedConsent.hasValidConsent) {
        onReady(storedConsent.fullName, storedConsent.consentAt);
        setCheckingConsent(false);
        return;
      }

      // Then check database if user is logged in
      if (user?.id) {
        const { data, error } = await supabase
          .from("train_consents")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!error && data && data.consent_train && data.consent_store) {
          // Store in localStorage for faster access
          const consentAt = storeConsent(data.full_name, data.consent_train, data.consent_store);
          onReady(data.full_name, consentAt);
          setCheckingConsent(false);
          return;
        }
      }

      // No valid consent found, show modal
      setIsOpen(true);
      setCheckingConsent(false);
    } catch (error) {
      console.error('Error checking consent:', error);
      setIsOpen(true);
      setCheckingConsent(false);
    }
  };

  const saveConsent = async () => {
    if (!fullName || fullName.trim().length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }

    if (!consentTrain || !consentStore) {
      toast.error("Debes aceptar ambos consentimientos para continuar");
      return;
    }

    setLoading(true);
    
    try {
      const payload: any = {
        full_name: fullName.trim(),
        consent_train: consentTrain,
        consent_store: consentStore,
      };

      if (user?.id) {
        payload.user_id = user.id;
      } else {
        payload.session_id = getOrCreateSessionId();
      }

      // Upsert to database
      const { error } = await supabase
        .from("train_consents")
        .upsert(payload, { 
          onConflict: user?.id ? "user_id" : "session_id",
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Store in localStorage
      const consentAt = storeConsent(payload.full_name, payload.consent_train, payload.consent_store);

      setIsOpen(false);
      onReady(payload.full_name, consentAt);
      
      toast.success("Consentimiento guardado correctamente");
    } catch (error) {
      console.error('Error saving consent:', error);
      toast.error("Error al guardar el consentimiento. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/?tab=transcribe');
  };

  const isValid = consentTrain && consentStore && fullName.trim().length >= 2;

  if (checkingConsent) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando consentimiento...</p>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} modal onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
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

          {/* Full Name Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
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

          {/* Consent Options */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 border-2 border-primary/30 rounded-lg hover:bg-muted/30 transition-colors bg-primary/5">
              <Checkbox
                id="consent-train"
                checked={consentTrain}
                onCheckedChange={(checked) => setConsentTrain(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="consent-train" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  Usar mi audio para entrenar el modelo de IA
                  <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">OBLIGATORIO</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Tu voz será utilizada para mejorar la precisión del reconocimiento de voz mediante 
                  técnicas de aprendizaje automático. Los datos se procesarán de forma pseudonimizada.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border-2 border-primary/30 rounded-lg hover:bg-muted/30 transition-colors bg-primary/5">
              <Checkbox
                id="consent-store"
                checked={consentStore}
                onCheckedChange={(checked) => setConsentStore(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="consent-store" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  Guardar mi audio en mi cuenta
                  <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">OBLIGATORIO</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  El audio se almacenará cifrado con AES-256 en tu cuenta para futuras referencias 
                  y mejoras personalizadas del servicio.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 gap-3">
            <Button 
              variant="outline"
              onClick={handleCancel}
              className="flex-1 sm:flex-none"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={saveConsent} 
              disabled={!isValid || loading}
              className="flex-1 sm:flex-none"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Acepto y quiero continuar
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Puedes retirar tu consentimiento en cualquier momento desde "Mis datos".
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};