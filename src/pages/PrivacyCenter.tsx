import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Shield, FileText, Database, Trash2, Download, Eye, AlertTriangle, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from '@/lib/sessionManager';

interface ConsentRecord {
  id: string;
  session_id: string;
  consent_train: boolean;
  consent_store: boolean;
  consent_timestamp: string;
  withdrawn_at: string | null;
}

export const PrivacyCenter = () => {
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [recordingsCount, setRecordingsCount] = useState(0);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const loadConsentRecords = async () => {
    try {
      if (user) {
        // For authenticated users, we don't have consent logs in the current schema
        // Consent is implicit for authenticated users
        setConsentRecords([]);
      } else {
        // For guest users, load consent logs
        const session = sessionManager.getSession();
        if (!session) return;
        
        const { data, error } = await supabase
          .from('consent_logs')
          .select('*')
          .eq('session_id', session.sessionId)
          .order('consent_timestamp', { ascending: false });
          
        if (error) throw error;
        setConsentRecords(data || []);
      }
    } catch (error) {
      console.error('Error loading consent records:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros de consentimiento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecordingsCount = async () => {
    if (!user) return;
    
    try {
      const { count, error } = await supabase
        .from('recordings')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      setRecordingsCount(count || 0);
    } catch (error) {
      console.error('Error loading recordings count:', error);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadConsentRecords();
      if (user) {
        loadRecordingsCount();
      }
    }
  }, [user, authLoading]);

  const exportUserData = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para exportar tus datos",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get user recordings
      const { data: recordings, error: recordingsError } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (recordingsError) throw recordingsError;

      // Get user consent records (if any)
      const { data: consents, error: consentsError } = await supabase
        .from('consent_logs')
        .select('*')
        .order('consent_timestamp', { ascending: false });

      if (consentsError) {
        console.error('Error loading consent logs:', consentsError);
      }

      const userData = {
        user_info: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in: user.last_sign_in_at
        },
        recordings: recordings || [],
        consent_logs: consents || [],
        export_timestamp: new Date().toISOString(),
        export_format_version: "1.0"
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adagio-user-data-${user.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Datos exportados",
        description: `Se han exportado ${recordings?.length || 0} grabaciones y metadatos asociados`
      });
    } catch (error) {
      console.error('Error exporting user data:', error);
      toast({
        title: "Error",
        description: "No se pudieron exportar tus datos",
        variant: "destructive"
      });
    }
  };

  const deleteAllUserData = async () => {
    if (!user) return;

    if (!confirm('¿Estás seguro de que quieres eliminar TODAS tus grabaciones? Esta acción no se puede deshacer.')) {
      return;
    }

    if (!confirm('Esta acción eliminará permanentemente todos tus datos. Escribirás "ELIMINAR TODO" para confirmar')) {
      const confirmation = prompt('Escribe "ELIMINAR TODO" para confirmar:');
      if (confirmation !== 'ELIMINAR TODO') {
        return;
      }
    }

    try {
      setIsWithdrawing(true);
      
      // Delete all user recordings
      const { error: recordingsError } = await supabase
        .from('recordings')
        .delete()
        .eq('user_id', user.id);

      if (recordingsError) throw recordingsError;

      setRecordingsCount(0);
      
      toast({
        title: "Datos eliminados",
        description: "Todas tus grabaciones han sido eliminadas permanentemente"
      });
    } catch (error) {
      console.error('Error deleting user data:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar todos los datos",
        variant: "destructive"
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleWithdrawConsent = async (recordId: string) => {
    setIsWithdrawing(true);
    try {
      // Withdraw consent (logical deletion)
      const { error: updateError } = await supabase
        .from('consent_logs')
        .update({ withdrawn_at: new Date().toISOString() })
        .eq('id', recordId);
        
      if (updateError) throw updateError;

      // Create unlearning job
      const { error: jobError } = await supabase
        .from('unlearning_jobs')
        .insert({
          consent_log_id: recordId,
          status: 'pending',
          metadata: {
            withdrawal_timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        });
        
      if (jobError) throw jobError;

      toast({
        title: "Consentimiento retirado",
        description: "Se ha iniciado el proceso de eliminación de tus datos del modelo"
      });

      // Reload records
      loadConsentRecords();
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      toast({
        title: "Error",
        description: "No se pudo retirar el consentimiento",
        variant: "destructive"
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const exportData = async () => {
    try {
      const session = sessionManager.getSession();
      const data = {
        session_info: session,
        consent_records: consentRecords,
        export_timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adagio-data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Datos exportados",
        description: "Se ha descargado un archivo con todos tus datos"
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "No se pudieron exportar los datos",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#005c64]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <Link to="/" className="inline-flex items-center text-white hover:text-white/90 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Adagio
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-white flex items-center justify-center gap-3">
              <Shield className="h-8 w-8" />
              Centro de Privacidad
            </h1>
            <p className="text-lg text-white">
              Gestiona tus datos y configuraciones de privacidad
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Overview Card */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información General
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">¿Qué datos recopilamos?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Grabaciones de audio (solo con tu consentimiento)</li>
                  <li>• Datos de sesión anónimos (ID de sesión, timestamps)</li>
                  <li>• Metadatos técnicos (calidad de audio, duración)</li>
                  <li>• Datos biométricos de voz (solo si consientes)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Tus derechos RGPD</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Derecho de acceso a tus datos</li>
                  <li>• Derecho de rectificación</li>
                  <li>• Derecho de supresión ("derecho al olvido")</li>
                  <li>• Derecho de portabilidad</li>
                  <li>• Derecho de oposición al tratamiento</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* User Data Management (only for authenticated users) */}
          {user && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Mis Datos de Usuario
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Información de cuenta</h3>
                    <p className="text-sm text-muted-foreground">Email: {user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Grabaciones: {recordingsCount} archivo{recordingsCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Acciones disponibles</h3>
                    <div className="flex gap-2">
                      <Button onClick={exportUserData} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar mis datos
                      </Button>
                      <Button 
                        onClick={deleteAllUserData}
                        disabled={isWithdrawing || recordingsCount === 0}
                        variant="destructive" 
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar todo
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Consent Records */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Database className="h-5 w-5" />
                Historial de Consentimientos
              </h2>
              {!user && (
                <Button onClick={exportData} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Datos (Invitado)
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando registros...
              </div>
            ) : consentRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>
                  {user ? 
                    'Como usuario registrado, tu consentimiento se gestiona automáticamente' :
                    'No hay registros de consentimiento'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {consentRecords.map(record => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={record.withdrawn_at ? "destructive" : "default"}>
                            {record.withdrawn_at ? "Retirado" : "Activo"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(record.consent_timestamp).toLocaleString('es-ES')}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${record.consent_train ? 'bg-green-500' : 'bg-red-500'}`} />
                            Entrenar modelo: {record.consent_train ? 'Sí' : 'No'}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${record.consent_store ? 'bg-green-500' : 'bg-red-500'}`} />
                            Guardar en cuenta: {record.consent_store ? 'Sí' : 'No'}
                          </div>
                        </div>
                      </div>
                      {!record.withdrawn_at && (
                        <Button 
                          onClick={() => handleWithdrawConsent(record.id)} 
                          disabled={isWithdrawing} 
                          variant="destructive" 
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Retirar
                        </Button>
                      )}
                    </div>
                    {record.withdrawn_at && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Consentimiento retirado el {new Date(record.withdrawn_at).toLocaleString('es-ES')}. 
                          Se ha iniciado el proceso de eliminación de datos.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Legal Information */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Información Legal</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium mb-2">Base Legal del Tratamiento</h3>
                <p className="text-muted-foreground">
                  El tratamiento de tus datos se basa en tu consentimiento explícito (Art. 6.1.a RGPD) 
                  para el entrenamiento del modelo, y en nuestro interés legítimo (Art. 6.1.f RGPD) 
                  para mejorar el servicio cuando guardas datos en tu cuenta.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Datos Biométricos</h3>
                <p className="text-muted-foreground">
                  Las grabaciones de voz pueden contener datos biométricos según el Art. 9 RGPD. 
                  Solo procesamos estos datos con tu consentimiento explícito y para los fines 
                  específicos que has autorizado.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Retención de Datos</h3>
                <p className="text-muted-foreground">
                  Los datos se conservan únicamente durante el tiempo necesario para cumplir 
                  los fines para los que fueron recopilados. Puedes solicitar su eliminación 
                  en cualquier momento.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Contacto</h3>
                <p className="text-muted-foreground">
                  Para ejercer tus derechos o realizar consultas sobre privacidad, 
                  contacta con nosotros en: <strong>adagio@symplia.es</strong>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};