import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAdmin } from '@/contexts/AdminContext';
import { secureStorage } from '@/lib/secureStorage';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  Play, 
  Pause, 
  Search, 
  RefreshCw, 
  Clock, 
  FileAudio, 
  Shield, 
  ShieldOff,
  CheckCircle,
  XCircle,
  User,
  Trash2,
  Archive,
  ArrowUpDown,
  Eye,
  EyeOff
} from 'lucide-react';

interface RecordingData {
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
  identity_available: boolean;
}

interface IdentityData {
  session_pseudonym: string;
  email: string;
  full_name: string;
  created_at: string;
}

export const AdminRecordings = () => {
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [identityCache, setIdentityCache] = useState<Map<string, IdentityData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof RecordingData>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showIdentities, setShowIdentities] = useState(false);
  const { toast } = useToast();
  const { adminUser } = useAdmin();

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      console.log('Fetching recordings using admin session token...');

      const sessionToken = await secureStorage.getAdminSession();
      if (!sessionToken) {
        throw new Error('No valid admin session found');
      }

      // Use the admin edge function to get recordings with proper session validation
      const response = await supabase.functions.invoke('admin-get-recordings', {
        body: { sessionToken }
      });

      if (response.error) {
        console.error('Error from admin-get-recordings function:', response.error);
        throw response.error;
      }

      const recordings = response.data?.data || [];
      
      const transformedData = recordings.map((m: any) => ({
        id: m.id,
        session_pseudonym: m.session_pseudonym || 'N/A',
        phrase_text: m.phrase_text || '',
        duration_ms: m.duration_ms || 0,
        sample_rate: m.sample_rate || 0,
        audio_format: m.audio_format || 'wav',
        device_info: m.device_info || 'Unknown device',
        quality_score: m.quality_score,
        consent_train: m.consent_train || false,
        consent_store: m.consent_store || false,
        encryption_key_version: m.encryption_key_version || 1,
        unencrypted_file_path: m.unencrypted_file_path,
        unencrypted_storage_bucket: m.unencrypted_storage_bucket,
        file_size_bytes: m.file_size_bytes,
        unencrypted_file_size_bytes: m.unencrypted_file_size_bytes,
        created_at: m.created_at,
        identity_available: m.identity_available || false
      })) as RecordingData[];

      console.log(`Fetched ${transformedData.length} recordings with pseudonyms; identity data separated for privacy`);
      
      if (response.data?.privacy_note) {
        console.log('Privacy note:', response.data.privacy_note);
      }

      setRecordings(transformedData);
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

  // Función para obtener identidad específica (con auditoría)
  const getIdentityForPseudonym = async (pseudonym: string): Promise<IdentityData | null> => {
    if (identityCache.has(pseudonym)) {
      return identityCache.get(pseudonym) || null;
    }

    try {
      const sessionToken = await secureStorage.getAdminSession();
      if (!sessionToken) return null;

      const { data, error } = await supabase.rpc('admin_get_identity_for_pseudonym', {
        pseudonym,
        admin_session_token: sessionToken
      });

      if (error || !data || data.length === 0) {
        return null;
      }

      const identity = data[0] as IdentityData;
      
      const newCache = new Map(identityCache);
      newCache.set(pseudonym, identity);
      setIdentityCache(newCache);

      return identity;
    } catch (error) {
      console.error('Error fetching identity:', error);
      return null;
    }
  };

  // Función para cargar todas las identidades
  const loadAllIdentities = async () => {
    const pseudonyms = recordings
      .filter(r => r.identity_available && !identityCache.has(r.session_pseudonym))
      .map(r => r.session_pseudonym);

    for (const pseudonym of pseudonyms) {
      await getIdentityForPseudonym(pseudonym);
    }
  };

  // Función para mostrar identidad en la UI
  const renderIdentityInfo = (recording: RecordingData) => {
    if (!recording.identity_available) {
      return <span className="text-muted-foreground">N/A</span>;
    }

    if (!showIdentities) {
      return (
        <div className="flex items-center text-muted-foreground">
          <EyeOff className="w-3 h-3 mr-1" />
          <span className="text-xs">Oculto</span>
        </div>
      );
    }

    const cachedIdentity = identityCache.get(recording.session_pseudonym);
    if (cachedIdentity) {
      return (
        <div className="text-sm">
          <div className="font-medium">{cachedIdentity.full_name}</div>
          <div className="text-muted-foreground text-xs">{cachedIdentity.email}</div>
        </div>
      );
    }

    return (
      <Button
        variant="ghost" 
        size="sm"
        onClick={async () => {
          const identity = await getIdentityForPseudonym(recording.session_pseudonym);
          if (!identity) {
            toast({
              title: "Identidad no encontrada",
              description: "No se pudo obtener la información de identidad",
              variant: "destructive"
            });
          }
        }}
        className="h-auto p-1 text-xs"
      >
        <User className="w-3 h-3 mr-1" />
        Ver identidad
      </Button>
    );
  };

  const handleDownloadEncrypted = async (recordingId: string) => {
    try {
      toast({
        title: "Descarga iniciada",
        description: "Procesando archivo cifrado..."
      });

      const sessionToken = await secureStorage.getAdminSession();
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
          sessionToken: sessionToken,
          downloadType: 'encrypted'
        }
      });

      if (response.error) {
        console.error('Edge function error:', response.error);
        
        // Handle FunctionsHttpError (non-2xx responses) - intentar con unencrypted
        if (response.error.name === 'FunctionsHttpError') {
          console.log('FunctionsHttpError received, attempting unencrypted download as fallback...');
          
          try {
            const unencryptedResponse = await supabase.functions.invoke('decrypt-download', {
              body: {
                recordingId: recordingId,
                sessionToken: sessionToken,
                downloadType: 'unencrypted'
              }
            });
            
            if (!unencryptedResponse.error && unencryptedResponse.data) {
              const { base64, filename, mimeType } = unencryptedResponse.data;
              const byteCharacters = atob(base64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: mimeType || 'audio/wav' });
              
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              
              toast({
                title: "Descarga completada",
                description: "No había versión cifrada. Se descargó la versión sin cifrar."
              });
              return;
            }
          } catch (fallbackError) {
            console.error('Unencrypted fallback also failed:', fallbackError);
          }
          
          toast({
            title: "Error del servidor",
            description: "El servidor no pudo procesar la descarga en ningún formato.",
            variant: "destructive"
          });
          return;
        }

        // Handle specific error cases from the edge function
        if (response.error.error === 'LEGACY_CLIENT_ENCRYPTED') {
          toast({
            title: "Archivo legacy detectado",
            description: response.error.hasUnencrypted 
              ? "Esta grabación fue cifrada por el cliente. Usa la descarga sin cifrar disponible."
              : "Esta grabación legacy no se puede descifrar y no tiene versión sin cifrar.",
            variant: "destructive"
          });
          return;
        }
        
        throw response.error;
      }

      if (!response.data) {
        throw new Error('No data received from server');
      }

      const { base64, filename, mimeType, isLegacyFallback, message } = response.data;
      
      if (!base64 || !filename) {
        throw new Error('Invalid response format from server');
      }
      
      if (isLegacyFallback) {
        toast({
          title: "Descarga con fallback",
          description: message,
          variant: "default"
        });
      }

      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType || 'audio/wav' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Solo mostrar toast de éxito si no es legacyFallback (que ya tiene su propio toast)
      if (!isLegacyFallback) {
        toast({
          title: "Descarga completada",
          description: `Archivo ${filename} descargado correctamente`
        });
      }
    } catch (error: any) {
      console.error('Error downloading encrypted file:', error);
      
      const errorMessage = error?.message || error?.details || 'Error desconocido al descargar el archivo';
      
      toast({
        title: "Error de descarga",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleDownloadUnencrypted = async (recording: RecordingData) => {
    if (!recording.unencrypted_file_path) {
      toast({
        title: "Archivo no disponible",
        description: "Esta grabación no tiene versión sin cifrar disponible",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Descarga iniciada",
        description: "Procesando archivo sin cifrar..."
      });

      const sessionToken = await secureStorage.getAdminSession();
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
          recordingId: recording.id,
          sessionToken: sessionToken,
          downloadType: 'unencrypted'
        }
      });

      if (response.error) {
        throw response.error;
      }

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
      console.error('Error downloading unencrypted file:', error);
      toast({
        title: "Error de descarga",
        description: "No se pudo descargar el archivo sin cifrar",
        variant: "destructive"
      });
    }
  };

  const handleForceDownloadUnencrypted = async (recordingId: string) => {
    try {
      toast({
        title: "Descarga iniciada",
        description: "Buscando versión sin cifrar..."
      });

      const sessionToken = await secureStorage.getAdminSession();
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
          recordingId,
          sessionToken,
          downloadType: 'unencrypted'
        }
      });

      if (response.error || !response.data?.base64) {
        throw response.error || new Error('No se recibió contenido');
      }

      const { base64, filename, mimeType } = response.data;
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType || 'audio/wav' });

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
      console.error('Error forcing unencrypted download:', error);
      toast({
        title: "Error de descarga",
        description: "No se pudo descargar la versión sin cifrar",
        variant: "destructive"
      });
    }
  };

  const handleBackfillUnencryptedSelected = async (ids: string[]) => {
    try {
      toast({ 
        title: 'Generando versiones sin cifrar', 
        description: `Procesando ${ids.length} grabación(es)...` 
      });
      
      const sessionToken = await secureStorage.getAdminSession();
      if (!sessionToken) {
        toast({ 
          title: 'Error de autorización', 
          description: 'No tienes permisos', 
          variant: 'destructive' 
        });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('admin-backfill-unencrypted', {
        body: { sessionToken, recordingIds: ids }
      });
      
      if (error) throw error;
      
      await fetchRecordings();
      
      toast({ 
        title: 'Generación completada', 
        description: `Éxito: ${data.success} · Fallidos: ${data.failed} · Omitidos: ${data.skipped}` 
      });
    } catch (e) {
      console.error('Backfill error:', e);
      toast({ 
        title: 'Error al generar sin cifrar', 
        description: 'Revisa los logs del servidor', 
        variant: 'destructive' 
      });
    }
  };

  const handlePlayUnencrypted = async (recording: RecordingData) => {
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
        setPlayingId(null);
        return;
      }

      const sessionToken = await secureStorage.getAdminSession();
      if (!sessionToken) {
        toast({
          title: "Error de autorización",
          description: "No tienes permisos para reproducir archivos",
          variant: "destructive"
        });
        return;
      }

      const response = await supabase.functions.invoke('decrypt-download', {
        body: {
          recordingId: recording.id,
          sessionToken: sessionToken,
          downloadType: 'unencrypted'
        }
      });

      if (response.error) {
        throw response.error;
      }

      const { base64, mimeType } = response.data;
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const url = window.URL.createObjectURL(blob);
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

  const handleSort = (field: keyof RecordingData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecordings(new Set(filteredRecordings.map(r => r.id)));
    } else {
      setSelectedRecordings(new Set());
    }
  };

  const handleSelectRecording = (recordingId: string, checked: boolean) => {
    const newSelected = new Set(selectedRecordings);
    if (checked) {
      newSelected.add(recordingId);
    } else {
      newSelected.delete(recordingId);
    }
    setSelectedRecordings(newSelected);
  };

  const handleSingleDelete = async (recordingId: string) => {
    const sessionToken = await secureStorage.getAdminSession();
    if (!sessionToken) {
      toast({ 
        title: 'Error de autorización', 
        description: 'No tienes permisos para eliminar', 
        variant: 'destructive' 
      });
      return;
    }
    
    const response = await supabase.functions.invoke('admin-delete-recording', { 
      body: { recordingId, sessionToken } 
    });
    
    if (response.error) {
      console.error(response.error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo eliminar', 
        variant: 'destructive' 
      });
      return;
    }
    
    toast({ 
      title: 'Eliminada', 
      description: 'La grabación ha sido eliminada' 
    });
    
    await fetchRecordings();
  };

  // Filtrado que incluye búsqueda en cache de identidades
  const filteredRecordings = recordings
    .filter(recording => {
      const searchLower = searchQuery.toLowerCase();
      
      // Búsqueda básica en datos de grabación
      const basicMatch = (
        recording.phrase_text.toLowerCase().includes(searchLower) ||
        recording.session_pseudonym.toLowerCase().includes(searchLower) ||
        recording.device_info.toLowerCase().includes(searchLower)
      );

      // Búsqueda en identidades cacheadas
      const cachedIdentity = identityCache.get(recording.session_pseudonym);
      const identityMatch = cachedIdentity && (
        cachedIdentity.full_name.toLowerCase().includes(searchLower) ||
        cachedIdentity.email.toLowerCase().includes(searchLower)
      );

      return basicMatch || identityMatch;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando grabaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Grabaciones de Audio</h1>
          <div className="flex gap-2">
            <Button 
              variant={showIdentities ? "default" : "outline"}
              size="sm"
              onClick={async () => {
                if (!showIdentities) {
                  await loadAllIdentities();
                }
                setShowIdentities(!showIdentities);
              }}
            >
              {showIdentities ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {showIdentities ? 'Ocultar identidades' : 'Mostrar identidades'}
            </Button>
            <Button onClick={fetchRecordings} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            Gestiona las grabaciones con separación de datos de identidad para privacidad
          </p>
          <Badge variant="secondary" className="text-xs">
            Datos separados por privacidad
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por pseudónimo, frase o dispositivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{filteredRecordings.length}</p>
            </div>
            <FileAudio className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Con identidad</p>
              <p className="text-2xl font-bold">{filteredRecordings.filter(r => r.identity_available).length}</p>
            </div>
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sin cifrar</p>
              <p className="text-2xl font-bold">{filteredRecordings.filter(r => r.unencrypted_file_path).length}</p>
            </div>
            <ShieldOff className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Seleccionadas</p>
              <p className="text-2xl font-bold">{selectedRecordings.size}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedRecordings.size > 0 && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedRecordings.size} grabación(es) seleccionada(s)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const selectedIds = Array.from(selectedRecordings);
                  for (const recordingId of selectedIds) {
                    await handleDownloadEncrypted(recordingId);
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar cifrados
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const selectedIds = Array.from(selectedRecordings);
                  const availableRecordings = recordings.filter(r => 
                    selectedIds.includes(r.id) && r.unencrypted_file_path
                  );
                  
                  if (availableRecordings.length === 0) {
                    toast({
                      title: "Sin archivos disponibles",
                      description: "Ninguna de las grabaciones seleccionadas tiene versión sin cifrar",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  for (const recording of availableRecordings) {
                    await handleDownloadUnencrypted(recording);
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                  
                  toast({
                    title: "Descarga completada",
                    description: `${availableRecordings.length} archivo(s) descargado(s)`
                  });
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar sin cifrar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  const selectedIds = Array.from(selectedRecordings);
                  
                  if (!confirm(`¿Estás seguro de eliminar ${selectedIds.length} grabación(es)?`)) {
                    return;
                  }
                  
                  let deletedCount = 0;
                  for (const recordingId of selectedIds) {
                    await handleSingleDelete(recordingId);
                    deletedCount++;
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }
                  
                  setSelectedRecordings(new Set());
                  
                  toast({
                    title: "Eliminación completada",
                    description: `${deletedCount} grabación(es) eliminada(s)`
                  });
                  
                  await fetchRecordings();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar seleccionados
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Recordings Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRecordings.size === filteredRecordings.length && filteredRecordings.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('session_pseudonym')}>
                  <div className="flex items-center gap-1">
                    Pseudónimo
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead>Identidad</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('phrase_text')}>
                  <div className="flex items-center gap-1">
                    Frase
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('duration_ms')}>
                  <div className="flex items-center gap-1">
                    Duración
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead>Consentimientos</TableHead>
                <TableHead>Cifrado</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">
                    Fecha
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecordings.map((recording) => (
                <TableRow key={recording.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRecordings.has(recording.id)}
                      onCheckedChange={(checked) => handleSelectRecording(recording.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {recording.session_pseudonym}
                  </TableCell>
                  <TableCell>
                    {renderIdentityInfo(recording)}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={recording.phrase_text}>
                      {recording.phrase_text}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(recording.duration_ms)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant={recording.consent_train ? "default" : "secondary"} className="text-xs">
                        {recording.consent_train ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        Entrenar
                      </Badge>
                      <Badge variant={recording.consent_store ? "default" : "secondary"} className="text-xs">
                        {recording.consent_store ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        Almacenar
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {recording.unencrypted_file_path ? (
                        <Badge variant="destructive" className="text-xs">
                          <ShieldOff className="w-3 h-3 mr-1" />
                          Sin cifrar
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Cifrado v{recording.encryption_key_version}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>Cifrado: {formatFileSize(recording.file_size_bytes)}</div>
                      {recording.unencrypted_file_size_bytes && (
                        <div className="text-muted-foreground">Sin cifrar: {formatFileSize(recording.unencrypted_file_size_bytes)}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(recording.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {recording.unencrypted_file_path ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePlayUnencrypted(recording)}
                            title="Reproducir archivo sin cifrar"
                          >
                            {playingId === recording.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadUnencrypted(recording)}
                            title="Descargar sin cifrar"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSingleDelete(recording.id)}
                            title="Eliminar grabación"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadEncrypted(recording.id)}
                            title="Descargar cifrado"
                          >
                            <Archive className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSingleDelete(recording.id)}
                            title="Eliminar grabación"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {filteredRecordings.length === 0 && (
        <div className="text-center py-8">
          <FileAudio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No hay grabaciones</h3>
          <p className="text-muted-foreground">No se encontraron grabaciones que coincidan con tu búsqueda.</p>
        </div>
      )}
    </div>
  );
};