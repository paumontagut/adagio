import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Play, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw,
  Calendar,
  Volume2,
  Lock,
  Unlock,
  CheckSquare,
  Square
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Recording {
  id: string;
  phrase_text?: string;
  audio_url?: string;
  duration_ms?: number;
  sample_rate?: number;
  format?: string;
  created_at: string;
  consent_store?: boolean;
  consent_train?: boolean;
  user_id?: string;
  session_id?: string;
  // For encrypted recordings
  session_pseudonym?: string;
  quality_score?: number;
  audio_format?: string;
  encryption_key_version?: number;
  is_encrypted?: boolean;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  phraseText: string;
  consentType: 'all' | 'store' | 'train' | 'none';
  format: string;
  encrypted: 'all' | 'yes' | 'no';
}

export const AdminRecordings: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);
  const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    phraseText: '',
    consentType: 'all',
    format: '',
    encrypted: 'all'
  });

  const { adminUser, hasPermission } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    loadRecordings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recordings, filters]);

  const loadRecordings = async () => {
    try {
      setIsLoading(true);
      
      // Load both encrypted and unencrypted recordings
      const [
        { data: unencryptedRecordings, error: unencryptedError },
        { data: encryptedRecordings, error: encryptedError }
      ] = await Promise.all([
        supabase.from('recordings')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('audio_metadata')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (unencryptedError) throw unencryptedError;
      if (encryptedError) throw encryptedError;

      // Combine and mark recordings
      const combined: Recording[] = [
        ...(unencryptedRecordings || []).map(r => ({ ...r, is_encrypted: false })),
        ...(encryptedRecordings || []).map(r => ({ 
          ...r, 
          is_encrypted: true,
          // Map encrypted recording fields to common interface
          audio_url: null, // No direct URL for encrypted
          format: r.audio_format
        }))
      ];

      // Sort by created_at descending
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRecordings(combined);
    } catch (error: any) {
      console.error('Error loading recordings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las grabaciones",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...recordings];

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(r => 
        new Date(r.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(r => 
        new Date(r.created_at) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    // Text filter
    if (filters.phraseText) {
      filtered = filtered.filter(r => 
        r.phrase_text?.toLowerCase().includes(filters.phraseText.toLowerCase())
      );
    }

    // Consent filter
    if (filters.consentType !== 'all') {
      filtered = filtered.filter(r => {
        switch (filters.consentType) {
          case 'store':
            return r.consent_store === true;
          case 'train':
            return r.consent_train === true;
          case 'none':
            return !r.consent_store && !r.consent_train;
          default:
            return true;
        }
      });
    }

    // Format filter
    if (filters.format) {
      filtered = filtered.filter(r => 
        (r.format || r.audio_format)?.toLowerCase().includes(filters.format.toLowerCase())
      );
    }

    // Encryption filter
    if (filters.encrypted !== 'all') {
      filtered = filtered.filter(r => 
        filters.encrypted === 'yes' ? r.is_encrypted : !r.is_encrypted
      );
    }

    setFilteredRecordings(filtered);
  };

  const handleSelectAll = () => {
    if (selectedRecordings.size === filteredRecordings.length) {
      setSelectedRecordings(new Set());
    } else {
      setSelectedRecordings(new Set(filteredRecordings.map(r => r.id)));
    }
  };

  const handleSelectRecording = (recordingId: string) => {
    const newSelected = new Set(selectedRecordings);
    if (newSelected.has(recordingId)) {
      newSelected.delete(recordingId);
    } else {
      newSelected.add(recordingId);
    }
    setSelectedRecordings(newSelected);
  };

  const handleDownloadSelected = async () => {
    if (!hasPermission('viewer')) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para descargar grabaciones",
        variant: "destructive"
      });
      return;
    }

    if (selectedRecordings.size === 0) {
      toast({
        title: "Sin selección",
        description: "Selecciona al menos una grabación para descargar",
        variant: "destructive"
      });
      return;
    }

    try {
      // Call edge function for bulk download
      const selectedRecordingsList = Array.from(selectedRecordings);
      const { data, error } = await supabase.functions.invoke('admin-bulk-download', {
        body: { recordingIds: selectedRecordingsList }
      });

      if (error) throw error;

      if (data?.csvData) {
        // Create and download CSV file
        const blob = new Blob([data.csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `grabaciones_metadata_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Descarga completada",
          description: `Metadatos de ${selectedRecordings.size} grabaciones descargados. ${data.encryptedCount > 0 ? `Nota: ${data.encryptedCount} grabaciones cifradas requieren descifrado adicional.` : ''}`,
        });

        setSelectedRecordings(new Set());
      }
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Error de descarga",
        description: error.message || "No se pudieron descargar las grabaciones",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (!hasPermission('admin')) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para eliminar grabaciones",
        variant: "destructive"
      });
      return;
    }

    if (selectedRecordings.size === 0) return;

    const confirmDelete = confirm(
      `¿Estás seguro de que quieres eliminar ${selectedRecordings.size} grabaciones? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
      const selectedIds = Array.from(selectedRecordings);
      
      // Delete from both tables
      const encryptedIds = selectedIds.filter(id => 
        recordings.find(r => r.id === id)?.is_encrypted
      );
      const unencryptedIds = selectedIds.filter(id => 
        !recordings.find(r => r.id === id)?.is_encrypted
      );

      const promises = [];
      
      if (unencryptedIds.length > 0) {
        promises.push(
          supabase.from('recordings').delete().in('id', unencryptedIds)
        );
      }
      
      if (encryptedIds.length > 0) {
        promises.push(
          supabase.from('audio_metadata').delete().in('id', encryptedIds)
        );
      }

      await Promise.all(promises);

      toast({
        title: "Grabaciones eliminadas",
        description: `Se eliminaron ${selectedRecordings.size} grabaciones correctamente`,
      });

      setSelectedRecordings(new Set());
      loadRecordings();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudieron eliminar las grabaciones",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Grabaciones</h1>
          <p className="text-muted-foreground">
            {filteredRecordings.length} grabaciones encontradas ({recordings.length} total)
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={loadRecordings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phraseText">Texto</Label>
              <Input
                id="phraseText"
                placeholder="Buscar en texto..."
                value={filters.phraseText}
                onChange={(e) => setFilters(prev => ({ ...prev, phraseText: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Consentimiento</Label>
              <Select
                value={filters.consentType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, consentType: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="store">Almacenamiento</SelectItem>
                  <SelectItem value="train">Entrenamiento</SelectItem>
                  <SelectItem value="none">Sin consentimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <Input
                id="format"
                placeholder="wav, mp3..."
                value={filters.format}
                onChange={(e) => setFilters(prev => ({ ...prev, format: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Cifrado</Label>
              <Select
                value={filters.encrypted}
                onValueChange={(value) => setFilters(prev => ({ ...prev, encrypted: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Cifradas</SelectItem>
                  <SelectItem value="no">No cifradas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRecordings.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedRecordings.size} grabaciones seleccionadas
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadSelected}
                  disabled={!hasPermission('viewer')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Seleccionadas
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={!hasPermission('admin')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Seleccionadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRecordings.size === filteredRecordings.length && filteredRecordings.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Texto</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Cifrado</TableHead>
                <TableHead>Consentimiento</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecordings.map((recording) => (
                <TableRow key={recording.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRecordings.has(recording.id)}
                      onCheckedChange={() => handleSelectRecording(recording.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(recording.created_at), 'dd/MM/yyyy', { locale: es })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(recording.created_at), 'HH:mm:ss', { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {recording.phrase_text || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDuration(recording.duration_ms)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(recording.format || recording.audio_format || 'unknown').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {recording.is_encrypted ? (
                      <Badge variant="secondary">
                        <Lock className="h-3 w-3 mr-1" />
                        Cifrado
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Unlock className="h-3 w-3 mr-1" />
                        No cifrado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {recording.consent_store && (
                        <Badge variant="secondary" className="text-xs">
                          Almacén
                        </Badge>
                      )}
                      {recording.consent_train && (
                        <Badge variant="secondary" className="text-xs">
                          Entreno
                        </Badge>
                      )}
                      {!recording.consent_store && !recording.consent_train && (
                        <Badge variant="outline" className="text-xs">
                          Sin consentimiento
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3" />
                      </Button>
                      {recording.audio_url && (
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredRecordings.length === 0 && (
            <div className="text-center py-8">
              <Volume2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron grabaciones</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};