import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Search,
  Clock,
  Mail,
  User
} from 'lucide-react';

interface DeletionRequest {
  id: string;
  session_pseudonym: string;
  request_type: string;
  email?: string;
  verification_token?: string;
  full_name?: string;
  status: string;
  requested_at: string;
  verified_at?: string;
  processed_at?: string;
  completed_at?: string;
  notes?: string;
}

interface TokenVerificationData {
  valid: boolean;
  expired?: boolean;
  used?: boolean;
  tokenData?: {
    fullName: string;
    email: string;
    createdAt: string;
    expiresAt: string;
  };
}

export const GuestDataManager = () => {
  const [verificationToken, setVerificationToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<TokenVerificationData | null>(null);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null);
  const [requestMethod, setRequestMethod] = useState<'token' | 'manual'>('token');
  const { toast } = useToast();

  const handleVerifyToken = async () => {
    if (!verificationToken.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor introduce un token de verificación',
        variant: 'destructive'
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('guest-data-manager', {
        body: { verificationToken: verificationToken.trim() }
      });

      if (error) {
        throw error;
      }

      setVerificationResult(data);

      if (data.valid) {
        setFullName(data.tokenData?.fullName || '');
        setEmail(data.tokenData?.email || '');
        toast({
          title: 'Token válido',
          description: 'Token verificado correctamente. Puedes proceder con la eliminación.',
        });
      } else {
        toast({
          title: 'Token inválido',
          description: data.expired ? 'El token ha expirado' : data.used ? 'El token ya ha sido utilizado' : 'Token no válido',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error verifying token:', error);
      toast({
        title: 'Error',
        description: 'Error al verificar el token',
        variant: 'destructive'
      });
      setVerificationResult({ valid: false });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (requestMethod === 'token' && (!verificationResult?.valid || !verificationResult.tokenData)) {
      toast({
        title: 'Error',
        description: 'Primero verifica tu token',
        variant: 'destructive'
      });
      return;
    }

    if (requestMethod === 'manual' && (!fullName.trim() || !email.trim())) {
      toast({
        title: 'Error',
        description: 'Completa todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('guest-data-manager', {
        body: {
          action: 'request_deletion',
          sessionPseudonym: 'guest_session', // This would be actual session in real implementation
          requestType: requestMethod === 'token' ? 'guest_token' : 'manual_verification',
          email: email.trim(),
          verificationToken: requestMethod === 'token' ? verificationToken.trim() : undefined,
          fullName: fullName.trim(),
          additionalInfo: {
            description: additionalInfo.trim(),
            requestDate: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Solicitud enviada',
        description: 'Tu solicitud de eliminación ha sido procesada exitosamente',
      });

      // Reset form
      setVerificationToken('');
      setFullName('');
      setEmail('');
      setAdditionalInfo('');
      setVerificationResult(null);
      setDeletionRequest(data);

    } catch (error: any) {
      console.error('Error requesting deletion:', error);
      toast({
        title: 'Error',
        description: 'Error al procesar la solicitud de eliminación',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pendiente', icon: Clock },
      verified: { variant: 'default' as const, label: 'Verificada', icon: CheckCircle },
      processing: { variant: 'default' as const, label: 'Procesando', icon: Loader2 },
      completed: { variant: 'default' as const, label: 'Completada', icon: CheckCircle },
      failed: { variant: 'destructive' as const, label: 'Fallida', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Gestión de Datos GDPR
        </h2>
        <p className="text-muted-foreground">
          Solicita la eliminación de tus datos personales como usuario invitado
        </p>
      </div>

      {/* Method Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Método de Verificación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setRequestMethod('token')}
            className={`p-4 border rounded-lg text-left transition-colors ${
              requestMethod === 'token' 
                ? 'border-primary bg-primary/5' 
                : 'border-muted hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Token de Verificación</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Usa el token que recibiste por email al grabar
            </p>
          </button>

          <button
            onClick={() => setRequestMethod('manual')}
            className={`p-4 border rounded-lg text-left transition-colors ${
              requestMethod === 'manual' 
                ? 'border-primary bg-primary/5' 
                : 'border-muted hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <User className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Verificación Manual</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Proporciona tus datos para verificación del DPO
            </p>
          </button>
        </div>
      </Card>

      {/* Token Verification Section */}
      {requestMethod === 'token' && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Verificar Token</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="token">Token de Verificación</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="token"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="Introduce tu token de verificación"
                  className="font-mono"
                />
                <Button 
                  onClick={handleVerifyToken}
                  disabled={isVerifying || !verificationToken.trim()}
                  variant="outline"
                >
                  {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Verificar
                </Button>
              </div>
            </div>

            {verificationResult && (
              <Alert variant={verificationResult.valid ? 'default' : 'destructive'}>
                <AlertDescription>
                  {verificationResult.valid ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Token válido</span>
                      </div>
                      {verificationResult.tokenData && (
                        <div className="text-sm space-y-1">
                          <p><strong>Nombre:</strong> {verificationResult.tokenData.fullName}</p>
                          <p><strong>Email:</strong> {verificationResult.tokenData.email}</p>
                          <p><strong>Creado:</strong> {new Date(verificationResult.tokenData.createdAt).toLocaleString('es-ES')}</p>
                          <p><strong>Expira:</strong> {new Date(verificationResult.tokenData.expiresAt).toLocaleString('es-ES')}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        {verificationResult.expired ? 'Token expirado' : 
                         verificationResult.used ? 'Token ya utilizado' : 
                         'Token no válido'}
                      </span>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      )}

      {/* Data Form */}
      {(requestMethod === 'manual' || (requestMethod === 'token' && verificationResult?.valid)) && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Información para Eliminación</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  disabled={requestMethod === 'token' && verificationResult?.valid}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-email@ejemplo.com"
                  disabled={requestMethod === 'token' && verificationResult?.valid}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="additionalInfo">Información Adicional</Label>
              <Textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Proporciona cualquier información adicional que pueda ayudar a identificar tus grabaciones (fecha aproximada, contenido grabado, etc.)"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Esta información ayudará a nuestro DPO a localizar y eliminar tus datos más rápidamente
              </p>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Proceso de eliminación:</strong> Una vez enviada tu solicitud, nuestro equipo de protección de datos 
                revisará y procesará la eliminación en un plazo máximo de 30 días, conforme al GDPR.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleRequestDeletion}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando solicitud...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Solicitar Eliminación de Datos
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Success State */}
      {deletionRequest && (
        <Card className="p-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
              Solicitud Enviada Exitosamente
            </h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-green-800 dark:text-green-200">ID de solicitud:</span>
              <code className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-green-900 dark:text-green-100">
                {deletionRequest.id}
              </code>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-green-800 dark:text-green-200">Estado:</span>
              {getStatusBadge(deletionRequest.status)}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-green-800 dark:text-green-200">Solicitado:</span>
              <span className="text-green-800 dark:text-green-200">
                {new Date(deletionRequest.requested_at).toLocaleString('es-ES')}
              </span>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertDescription className="text-green-800 dark:text-green-200">
              Hemos recibido tu solicitud de eliminación de datos. Nuestro equipo de protección de datos 
              la revisará y procesará en un plazo máximo de 30 días. Te notificaremos por email cuando el proceso esté completo.
            </AlertDescription>
          </Alert>
        </Card>
      )}
    </div>
  );
};