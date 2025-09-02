import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  Play, 
  Pause, 
  Search, 
  Filter, 
  Clock, 
  FileAudio, 
  Shield, 
  ShieldOff,
  HardDrive,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AudioMetadata {
  id: string;
  session_pseudonym: string;
  phrase_text: string;
  duration_ms: number;
  sample_rate: number;
  audio_format: string;
  device_info: string;
  quality_score: number | null;
  consent_train: boolean;
  consent_store: boolean;
  encryption_key_version: number;
  unencrypted_file_path: string | null;
  unencrypted_storage_bucket: string | null;
  file_size_bytes: number | null;
  unencrypted_file_size_bytes: number | null;
  created_at: string;
}

export const AdminRecordings = () => {
  const [recordings, setRecordings] = useState<AudioMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConsent, setFilterConsent] = useState<'all' | 'train' | 'store'>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audio_metadata')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRecordings(data || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las grabaciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadEncrypted = async (recordingId: string) => {
    try {
      toast({
        title: "Descarga iniciada",
        description: "Procesando archivo cifrado..."
      });

      const sessionToken = localStorage.getItem('admin_session_token');
      if (!sessionToken) {
        toast({
          title: "Error de autorización",
          description: "No tienes permisos para descargar archivos",
          variant: "destructive"
        });
        return;
      }

      const response = await supabase.functions.invoke('decrypt-download', {
        body: {
          recordingId: recordingId,
          sessionToken: sessionToken
        }
      });

      if (response.error) {
        if (response.error.details === 'This recording was encrypted client-side and cannot be decrypted by the server') {
          toast({
            title: "Archivo legacy",
            description: "Esta grabación fue cifrada por el cliente y no puede ser descifrada automáticamente. Usa la descarga sin cifrar.",
            variant: "destructive"
          });
        } else {
          throw response.error;
        }
        return;
      }

      // Convert base64 to blob and download
      const { base64, filename, mimeType } = response.data;
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Descarga completada",
        description: `Archivo ${filename} descargado correctamente`
      });
    } catch (error) {
      console.error('Error downloading encrypted file:', error);
      toast({
        title: "Error de descarga",
        description: "No se pudo descargar el archivo cifrado",
        variant: "destructive"
      });
    }
  };

  const handleDownloadUnencrypted = async (recording: AudioMetadata) => {
    if (!recording.unencrypted_file_path) {
      toast({
        title: "Archivo no disponible",
        description: "Esta grabación no tiene versión sin cifrar disponible",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from(recording.unencrypted_storage_bucket || 'audio_raw')
        .download(recording.unencrypted_file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `unencrypted_${recording.phrase_text.substring(0, 30)}_${new Date(recording.created_at).toISOString().slice(0, 10)}.${recording.audio_format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Descarga completada",
        description: "Archivo sin cifrar descargado correctamente"
      });
    } catch (error) {
      console.error('Error downloading unencrypted file:', error);
      toast({
        title: "Error de descarga",
        description: "No se pudo descargar el archivo sin cifrar",
        variant: "destructive"
      });
    }
  };

  const handlePlayUnencrypted = async (recording: AudioMetadata) => {
    if (!recording.unencrypted_file_path) {
      toast({
        title: "Archivo no disponible",
        description: "Esta grabación no tiene versión sin cifrar para reproducir",
        variant: "destructive"
      });
      return;
    }

    try {
      if (playingId === recording.id) {
        // Stop current playback
        setPlayingId(null);
        return;
      }

      const { data, error } = await supabase.storage
        .from(recording.unencrypted_storage_bucket || 'audio_raw')
        .download(recording.unencrypted_file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const audio = new Audio(url);
      
      setPlayingId(recording.id);
      
      audio.onended = () => {
        setPlayingId(null);
        window.URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setPlayingId(null);
        window.URL.revokeObjectURL(url);
        toast({
          title: "Error de reproducción",
          description: "No se pudo reproducir el archivo de audio",
          variant: "destructive"
        });
      };

      await audio.play();
    } catch (error) {
      setPlayingId(null);
      console.error('Error playing audio:', error);
      toast({
        title: "Error de reproducción",
        description: "No se pudo reproducir el archivo de audio",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = !searchQuery || 
      recording.phrase_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recording.session_pseudonym.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recording.device_info.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterConsent === 'all' || 
      (filterConsent === 'train' && recording.consent_train) ||
      (filterConsent === 'store' && recording.consent_store);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Grabaciones de Audio</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Cargando grabaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Grabaciones de Audio</h2>
          <p className="text-muted-foreground">
            Gestiona las grabaciones con ambas versiones: cifrada y sin cifrar
          </p>
        </div>
        <Button onClick={fetchRecordings} variant="outline">
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por frase, pseudónimo o dispositivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={filterConsent === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterConsent('all')}
          >
            Todas
          </Button>
          <Button 
            variant={filterConsent === 'train' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterConsent('train')}
          >
            <Filter className="h-4 w-4 mr-1" />
            Entrenamiento
          </Button>
          <Button 
            variant={filterConsent === 'store' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterConsent('store')}
          >
            <HardDrive className="h-4 w-4 mr-1" />
            Almacenamiento
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <FileAudio className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold">{recordings.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Cifradas</p>
              <p className="text-2xl font-semibold">{recordings.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Sin Cifrar</p>
              <p className="text-2xl font-semibold">
                {recordings.filter(r => r.unencrypted_file_path).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Con Consentimiento</p>
              <p className="text-2xl font-semibold">
                {recordings.filter(r => r.consent_train && r.consent_store).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recordings List */}
      <div className="space-y-4">
        {filteredRecordings.length === 0 ? (
          <Card className="p-8 text-center">
            <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No se encontraron grabaciones</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterConsent !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Aún no hay grabaciones de audio disponibles'
              }
            </p>
          </Card>
        ) : (
          filteredRecordings.map((recording) => (
            <Card key={recording.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono text-muted-foreground">
                      {recording.session_pseudonym}
                    </span>
                    <Badge variant="outline">
                      v{recording.encryption_key_version}
                    </Badge>
                  </div>
                  <p className="font-medium mb-2">"{recording.phrase_text}"</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(recording.duration_ms)}
                    </div>
                    <span>{recording.sample_rate} Hz</span>
                    <span>{recording.audio_format.toUpperCase()}</span>
                    {recording.quality_score && (
                      <span>Calidad: {Math.round(recording.quality_score * 100)}%</span>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{formatDistanceToNow(new Date(recording.created_at), { 
                    addSuffix: true, 
                    locale: es 
                  })}</p>
                </div>
              </div>

              {/* Consent Badges */}
              <div className="flex gap-2 mb-4">
                <Badge variant={recording.consent_train ? "default" : "secondary"}>
                  {recording.consent_train ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  Entrenamiento
                </Badge>
                <Badge variant={recording.consent_store ? "default" : "secondary"}>
                  {recording.consent_store ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  Almacenamiento
                </Badge>
              </div>

              {/* File Versions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Encrypted Version */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Versión Cifrada</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tamaño: {formatFileSize(recording.file_size_bytes)} • AES-256-GCM
                  </p>
                  <Button 
                    onClick={() => handleDownloadEncrypted(recording.id)}
                    size="sm" 
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Cifrada
                  </Button>
                </div>

                {/* Unencrypted Version */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldOff className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Versión Sin Cifrar</span>
                  </div>
                  {recording.unencrypted_file_path ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-3">
                        Tamaño: {formatFileSize(recording.unencrypted_file_size_bytes)} • WAV
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handlePlayUnencrypted(recording)}
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                        >
                          {playingId === recording.id ? (
                            <Pause className="h-4 w-4 mr-2" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          {playingId === recording.id ? 'Pausar' : 'Reproducir'}
                        </Button>
                        <Button 
                          onClick={() => handleDownloadUnencrypted(recording)}
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-3">
                      No disponible para esta grabación
                    </p>
                  )}
                </div>
              </div>

              {/* Device Info */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Dispositivo:</strong> {recording.device_info}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};