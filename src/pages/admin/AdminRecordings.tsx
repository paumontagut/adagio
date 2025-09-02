import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  ArrowUpDown
} from 'lucide-react';

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
  full_name: string | null;
  email: string | null;
}

export const AdminRecordings = () => {
  const [recordings, setRecordings] = useState<AudioMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof AudioMetadata>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      // First, get all audio metadata
      const { data: audioData, error: audioError } = await supabase
        .from('audio_metadata')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (audioError) throw audioError;

      // Fetch guest verification tokens to map names by session_pseudonym (primary source)
      const { data: guestData, error: guestError } = await supabase
        .from('guest_verification_tokens')
        .select('session_pseudonym, full_name, email');
      if (guestError) throw guestError;

      // Also fetch consent logs as a secondary fallback (some deployments may have stored pseudonym in session_id)
      const { data: consentData, error: consentError } = await supabase
        .from('consent_logs')
        .select('session_id, full_name, email');
      if (consentError) throw consentError;

      // Build maps for quick lookup
      const guestMap = new Map<string, { full_name: string | null; email: string | null }>();
      guestData?.forEach((row: any) => {
        guestMap.set(row.session_pseudonym, {
          full_name: row.full_name ?? null,
          email: row.email ?? null,
        });
      });
      const consentMap = new Map<string, { full_name: string | null; email: string | null }>();
      consentData?.forEach((row: any) => {
        consentMap.set(row.session_id, {
          full_name: row.full_name ?? null,
          email: row.email ?? null,
        });
      });

      // Map the audio data to include full_name/email, preferring guest tokens
      const mappedData = (audioData || []).map((record: any) => {
        const guestInfo = guestMap.get(record.session_pseudonym);
        const consentInfo = consentMap.get(record.session_pseudonym); // fallback if some logs used pseudonym as session_id
        const info = guestInfo || consentInfo;
        return {
          ...record,
          full_name: info?.full_name || null,
          email: info?.email || null,
        } as AudioMetadata;
      });

      setRecordings(mappedData);
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
          sessionToken: sessionToken,
          downloadType: 'encrypted'
        }
      });

      if (response.error) {
        if (response.error.error === 'LEGACY_CLIENT_ENCRYPTED') {
          toast({
            title: "Archivo legacy detectado",
            description: response.error.hasUnencrypted 
              ? "Esta grabación fue cifrada por el cliente. Usa la descarga sin cifrar disponible."
              : "Esta grabación legacy no se puede descifrar y no tiene versión sin cifrar.",
            variant: "destructive"
          });
        } else {
          throw response.error;
        }
        return;
      }

      // Handle successful download (including legacy fallback)
      const { base64, filename, mimeType, isLegacyFallback, message } = response.data;
      
      if (isLegacyFallback) {
        toast({
          title: "Descarga con fallback",
          description: message,
          variant: "default"
        });
      }

      // Convert base64 to blob and download
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
      toast({
        title: "Descarga iniciada",
        description: "Procesando archivo sin cifrar..."
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
          recordingId: recording.id,
          sessionToken: sessionToken,
          downloadType: 'unencrypted'
        }
      });

      if (response.error) {
        throw response.error;
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

      const sessionToken = localStorage.getItem('admin_session_token');
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

      // Convert base64 to blob for playback
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

  const handleSort = (field: keyof AudioMetadata) => {
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

  const handleBulkDownloadEncrypted = async () => {
    const selectedIds = Array.from(selectedRecordings);
    if (selectedIds.length === 0) return;

    toast({
      title: "Descarga masiva iniciada",
      description: `Procesando ${selectedIds.length} archivos cifrados...`
    });

    for (const recordingId of selectedIds) {
      await handleDownloadEncrypted(recordingId);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const handleBulkDownloadUnencrypted = async () => {
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

    toast({
      title: "Descarga masiva iniciada",
      description: `Procesando ${availableRecordings.length} archivos sin cifrar...`
    });

    for (const recording of availableRecordings) {
      await handleDownloadUnencrypted(recording);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Array.from(selectedRecordings);
    if (selectedIds.length === 0) return;

    // This would need to be implemented as an edge function for proper deletion
    toast({
      title: "Función pendiente",
      description: "La eliminación masiva será implementada próximamente",
      variant: "default"
    });
  };

  const filteredRecordings = recordings
    .filter(recording => {
      const matchesSearch = !searchQuery || 
        recording.phrase_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recording.session_pseudonym.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recording.device_info.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (recording.full_name && recording.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (recording.email && recording.email.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
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
          <Button onClick={fetchRecordings} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
        <p className="text-muted-foreground">
          Gestiona las grabaciones con selección múltiple y acciones masivas
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, frase, pseudónimo o dispositivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileAudio className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{recordings.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Cifradas</p>
              <p className="text-2xl font-bold">{recordings.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ShieldOff className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Sin Cifrar</p>
              <p className="text-2xl font-bold">
                {recordings.filter(r => r.unencrypted_file_path).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Con Consentimiento</p>
              <p className="text-2xl font-bold">
                {recordings.filter(r => r.consent_train && r.consent_store).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Selection and Bulk Actions */}
      {selectedRecordings.size > 0 && (
        <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedRecordings.size} grabación(es) seleccionada(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleBulkDownloadEncrypted}
                variant="outline" 
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Descargar Cifradas
              </Button>
              <Button 
                onClick={handleBulkDownloadUnencrypted}
                variant="outline" 
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Descargar Sin Cifrar
              </Button>
              <Button 
                onClick={handleBulkDelete}
                variant="outline" 
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando grabaciones...</p>
          </div>
        </div>
      ) : filteredRecordings.length === 0 ? (
        <Card className="p-8 text-center">
          <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No se encontraron grabaciones</h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Aún no hay grabaciones de audio disponibles'
            }
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRecordings.size === filteredRecordings.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('full_name')}
                >
                  <div className="flex items-center gap-2">
                    Nombre Completo
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('phrase_text')}
                >
                  <div className="flex items-center gap-2">
                    Frase Grabada
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Versión Cifrada</TableHead>
                <TableHead>Versión Sin Cifrar</TableHead>
                <TableHead>Consentimiento</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-2">
                    Fecha
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecordings.map((recording) => (
                <TableRow 
                  key={recording.id}
                  data-state={selectedRecordings.has(recording.id) ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRecordings.has(recording.id)}
                      onCheckedChange={(checked) => 
                        handleSelectRecording(recording.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        {recording.full_name ? (
                          <div>
                            <span className="font-medium">{recording.full_name}</span>
                            <div className="text-xs text-muted-foreground font-mono">
                              {recording.session_pseudonym.substring(0, 16)}...
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono text-sm text-muted-foreground">
                              {recording.session_pseudonym.substring(0, 16)}...
                            </span>
                            <div className="text-xs text-muted-foreground">
                              (Sin nombre registrado)
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">"{recording.phrase_text}"</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(recording.duration_ms)}
                        <span>•</span>
                        <span>{recording.sample_rate} Hz</span>
                        <span>•</span>
                        <span>{recording.audio_format.toUpperCase()}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Disponible</span>
                      <Badge variant="outline" className="text-xs">
                        v{recording.encryption_key_version}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(recording.file_size_bytes)}
                    </p>
                  </TableCell>
                  <TableCell>
                    {recording.unencrypted_file_path ? (
                      <div className="flex items-center gap-2">
                        <ShieldOff className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">Disponible</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">No disponible</span>
                      </div>
                    )}
                    {recording.unencrypted_file_path && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(recording.unencrypted_file_size_bytes)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge 
                        variant={recording.consent_train ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {recording.consent_train ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        Entrenamiento
                      </Badge>
                      <Badge 
                        variant={recording.consent_store ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {recording.consent_store ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        Almacenamiento
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(recording.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => handleDownloadEncrypted(recording.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      {recording.unencrypted_file_path && (
                        <>
                          <Button
                            onClick={() => handlePlayUnencrypted(recording)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            {playingId === recording.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleDownloadUnencrypted(recording)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};