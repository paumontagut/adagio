import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Trash2, Shield, Mail, FileText, HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from '@/lib/sessionManager';
export const MyData = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletionCompleted, setDeletionCompleted] = useState(false);
  const {
    toast
  } = useToast();
  const handleDownloadData = async () => {
    setIsDownloading(true);
    try {
      const session = sessionManager.getSession();
      if (!session) {
        throw new Error('No session found');
      }
      toast({
        title: "Preparando descarga",
        description: "Recopilando tus datos y grabaciones cifradas..."
      });

      // Call edge function to prepare data export
      const {
        data: exportData,
        error
      } = await supabase.functions.invoke('data-export-handler/export', {
        body: {
          sessionId: session.sessionId
        }
      });
      if (error) {
        console.error('Export error:', error);
        throw new Error(`Export failed: ${error.message}`);
      }

      // Download the ZIP file
      if (exportData.downloadUrl) {
        const link = document.createElement('a');
        link.href = exportData.downloadUrl;
        link.download = `adagio-data-export-${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast({
        title: "Descarga iniciada",
        description: `Se han incluido ${exportData.recordCount} grabaciones y metadatos completos.`
      });
    } catch (error) {
      console.error('Error downloading data:', error);
      toast({
        title: "Error en la descarga",
        description: "No se pudieron descargar los datos. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };
  const handleDeleteAllData = async () => {
    if (deleteConfirmEmail !== 'eliminar@adagio.app' || deleteConfirmText !== 'ELIMINAR TODOS MIS DATOS') {
      toast({
        title: "Confirmación incorrecta",
        description: "Por favor, completa correctamente los campos de confirmación.",
        variant: "destructive"
      });
      return;
    }
    setIsDeleting(true);
    try {
      const session = sessionManager.getSession();
      if (!session) {
        throw new Error('No session found');
      }
      toast({
        title: "Iniciando eliminación",
        description: "Este proceso puede tardar varios minutos..."
      });

      // Call edge function for complete data deletion
      const {
        data: deletionResult,
        error
      } = await supabase.functions.invoke('data-deletion-handler/delete-all', {
        body: {
          sessionId: session.sessionId,
          confirmationEmail: deleteConfirmEmail,
          confirmationText: deleteConfirmText,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });
      if (error) {
        console.error('Deletion error:', error);
        throw new Error(`Deletion failed: ${error.message}`);
      }

      // Clear local session data
      localStorage.removeItem('adagio_encryption_key');
      sessionManager.clearSession();
      setDeletionCompleted(true);
      setShowDeleteDialog(false);
      toast({
        title: "Datos eliminados completamente",
        description: "Se ha enviado un correo de confirmación con los detalles del proceso."
      });
    } catch (error) {
      console.error('Error deleting data:', error);
      toast({
        title: "Error en la eliminación",
        description: "No se pudieron eliminar todos los datos. Contacta con soporte.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  if (deletionCompleted) {
    return <div className="min-h-screen bg-[#005c64] flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Datos Eliminados</h1>
            <p className="text-muted-foreground">
              Todos tus datos han sido eliminados permanentemente de nuestros sistemas. 
              Recibirás un correo de confirmación en los próximos minutos.
            </p>
            <div className="pt-4">
              <Link to="/">
                <Button variant="outline">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-[#005c64]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <Link to="/" className="inline-flex items-center text-white hover:text-white/90 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Adagio
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-white flex items-center justify-center gap-3">
              <HardDrive className="h-8 w-8" />
              Tus Datos
            </h1>
            <p className="text-lg text-white">
              Descarga o elimina tus datos según tus derechos RGPD
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Data Rights Information */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tus Derechos de Datos
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2 text-primary">Derecho de Portabilidad</h3>
                <p className="text-sm text-muted-foreground">
                  Puedes descargar todos tus datos en formato estructurado, 
                  incluyendo grabaciones cifradas, metadatos y registros de consentimiento.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-destructive">Derecho al Olvido</h3>
                <p className="text-sm text-muted-foreground">
                  Puedes solicitar la eliminación completa y permanente de todos 
                  tus datos de nuestros sistemas, incluyendo backups.
                </p>
              </div>
            </div>
          </Card>

          {/* Download Data Section */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Descargar Mis Datos
                </h3>
                <p className="text-muted-foreground">
                  Descarga un archivo ZIP con todos tus datos:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Grabaciones de audio cifradas (AES-256)</li>
                  <li>• Metadatos de sesiones y frases</li>
                  <li>• Registros de consentimiento con timestamps</li>
                  <li>• Claves de descifrado y parámetros</li>
                  <li>• Historial de interacciones</li>
                </ul>
              </div>
              <Button onClick={handleDownloadData} disabled={isDownloading} size="lg" className="min-w-[140px]">
                {isDownloading ? <>
                    <Download className="mr-2 h-4 w-4 animate-pulse" />
                    Preparando...
                  </> : <>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </>}
              </Button>
            </div>
          </Card>

          {/* Delete Data Section */}
          <Card className="p-6 border-destructive/20">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  Eliminar Mis Grabaciones
                </h3>
                <p className="text-muted-foreground">
                  Eliminación permanente de todos tus datos:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Grabaciones cifradas en almacenamiento</li>
                  <li>• Metadatos y registros de sesión</li>
                  <li>• Tokens y claves de acceso</li>
                  <li>• Datos de entrenamiento del modelo</li>
                  <li>• Copias de seguridad y cachés</li>
                </ul>
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Acción irreversible:</strong> Una vez eliminados, 
                    tus datos no podrán ser recuperados.
                  </AlertDescription>
                </Alert>
              </div>
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="lg" className="min-w-[140px]">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Todo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Confirmar Eliminación
                    </DialogTitle>
                    <DialogDescription>
                      Esta acción eliminará permanentemente todos tus datos. 
                      Para continuar, completa los siguientes campos:
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="delete-email">
                        Escribe: <code>eliminar@adagio.app</code>
                      </Label>
                      <Input id="delete-email" value={deleteConfirmEmail} onChange={e => setDeleteConfirmEmail(e.target.value)} placeholder="eliminar@adagio.app" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delete-text">
                        Escribe: <code>ELIMINAR TODOS MIS DATOS</code>
                      </Label>
                      <Input id="delete-text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="ELIMINAR TODOS MIS DATOS" />
                    </div>
                    <Alert>
                      <Mail className="h-4 w-4" />
                      <AlertDescription>
                        Recibirás un correo de confirmación con los detalles 
                        del proceso de eliminación y evidencia de cumplimiento.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAllData} disabled={isDeleting}>
                      {isDeleting ? <>
                          <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                          Eliminando...
                        </> : <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar Todo
                        </>}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          {/* Legal Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Información Legal
            </h2>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>
                <strong>Tiempo de procesamiento:</strong> Las solicitudes de eliminación 
                se procesan en un máximo de 30 días según el Art. 17 RGPD.
              </p>
              <p>
                <strong>Confirmación:</strong> Recibirás confirmación por correo electrónico 
                de todas las acciones realizadas sobre tus datos.
              </p>
              <p>
                <strong>Contacto:</strong> Para consultas adicionales, contacta con 
                nuestro DPO en <strong>adagio@symplia.es </strong>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>;
};