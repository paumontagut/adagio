import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Play, Download, Trash2, Calendar, Clock, Mic, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Recording {
  id: string;
  phrase_text: string;
  audio_url: string;
  duration_ms: number;
  sample_rate: number;
  format: string;
  device_label: string;
  consent_train: boolean;
  consent_store: boolean;
  created_at: string;
}

export const MyRecordings = () => {
  const { user, loading: authLoading } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchRecordings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecordings(data || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast.error('Error al cargar las grabaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchRecordings();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta grabación?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('recordings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecordings(prev => prev.filter(r => r.id !== id));
      toast.success('Grabación eliminada');
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Error al eliminar la grabación');
    }
  };

  const handleDownload = async (recording: Recording) => {
    if (!recording.consent_store) {
      toast.error('Esta grabación no tiene consentimiento para descarga');
      return;
    }

    try {
      // Generate filename
      const dateStr = format(new Date(recording.created_at), 'yyyy-MM-dd_HH-mm-ss');
      const phraseStr = recording.phrase_text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const filename = `${phraseStr}_${dateStr}.${recording.format}`;

      if (!recording.audio_url || recording.audio_url === 'encrypted_storage') {
        throw new Error('Archivo no disponible para descarga');
      }

      // Download from Supabase Storage
      const { data, error } = await supabase.storage
        .from('audio_raw')
        .download(recording.audio_url);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Descarga completada');
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast.error('Error al descargar la grabación');
    }
  };

  const handlePlay = async (recording: Recording) => {
    try {
      if (!recording.audio_url || recording.audio_url === 'encrypted_storage') {
        throw new Error('Archivo no disponible para reproducción');
      }

      // Prefer signed URL for streaming
      const { data, error } = await supabase.storage
        .from('audio_raw')
        .createSignedUrl(recording.audio_url, 60);

      if (error || !data?.signedUrl) {
        // Fallback to blob
        const dl = await supabase.storage.from('audio_raw').download(recording.audio_url);
        if (dl.error) throw dl.error;
        const objectUrl = URL.createObjectURL(dl.data);
        const audio = new Audio(objectUrl);
        await audio.play();
        return;
      }

      const audio = new Audio(data.signedUrl);
      await audio.play();
    } catch (err) {
      console.error('Error playing recording:', err);
      toast.error('No se pudo reproducir la grabación');
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#005c64] flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Cargando...</h2>
            <p className="text-muted-foreground">
              Obteniendo tus grabaciones.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#005c64] flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Inicia sesión</h2>
            <p className="text-muted-foreground mb-4">
              Necesitas iniciar sesión para ver tu historial de grabaciones.
            </p>
            <Link to="/">
              <Button>Volver al inicio</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#005c64]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Mis Grabaciones</h1>
          <p className="text-white/80">
            Historial de todas tus grabaciones de entrenamiento
          </p>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <p className="text-white/60">
            {recordings.length} grabación{recordings.length !== 1 ? 'es' : ''} encontrada{recordings.length !== 1 ? 's' : ''}
          </p>
          <Link to="/">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Volver al inicio
            </Button>
          </Link>
        </div>

        {recordings.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <Mic className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay grabaciones</h3>
              <p className="text-muted-foreground mb-4">
                Aún no has realizado ninguna grabación de entrenamiento.
              </p>
              <Link to="/?tab=train">
                <Button>Crear primera grabación</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {recordings.map((recording) => (
              <Card key={recording.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        "{recording.phrase_text}"
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {recording.format.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(recording.created_at), 'PPp', { locale: es })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(recording.duration_ms)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mic className="h-4 w-4" />
                        {recording.sample_rate} Hz
                      </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                      {recording.consent_train && (
                        <Badge variant="default" className="text-xs">
                          Entrenamiento autorizado
                        </Badge>
                      )}
                      {recording.consent_store && (
                        <Badge variant="secondary" className="text-xs">
                          Almacenamiento autorizado
                        </Badge>
                      )}
                    </div>

                    {recording.device_label && (
                      <p className="text-xs text-muted-foreground">
                        Dispositivo: {recording.device_label}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownload(recording)}
                      disabled={!recording.consent_store}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(recording.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};