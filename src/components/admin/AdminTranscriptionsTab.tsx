import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/lib/secureStorage';
import {
  RefreshCw, Search, Play, Pause, Download, Trash2,
  CheckCircle, XCircle, FileText, Clock,
} from 'lucide-react';

interface AdminTranscription {
  id: string;
  user_id: string;
  provider: string | null;
  text: string;
  original_text: string | null;
  corrected_text: string | null;
  is_validated: boolean | null;
  audio_path: string | null;
  audio_format: string | null;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

const formatBytes = (n: number | null) => {
  if (!n) return '-';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

export const AdminTranscriptionsTab = () => {
  const [items, setItems] = useState<AdminTranscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const sessionToken = await secureStorage.getAdminSession();
      if (!sessionToken) throw new Error('Sesión admin no válida');
      const res = await supabase.functions.invoke('admin-get-transcriptions', {
        body: { sessionToken, action: 'list' },
      });
      if (res.error) throw res.error;
      setItems((res.data?.data ?? []) as AdminTranscription[]);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudieron cargar las transcripciones', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const stopPlayback = () => {
    if (audio) { audio.pause(); audio.src = ''; }
    setAudio(null);
    setPlayingId(null);
  };

  const handlePlay = async (t: AdminTranscription) => {
    if (!t.audio_path) {
      toast({ title: 'Sin audio', description: 'Esta transcripción no tiene audio almacenado', variant: 'destructive' });
      return;
    }
    if (playingId === t.id) { stopPlayback(); return; }
    stopPlayback();
    try {
      const sessionToken = await secureStorage.getAdminSession();
      const res = await supabase.functions.invoke('admin-get-transcriptions', {
        body: { sessionToken, action: 'signed_url', audioPath: t.audio_path },
      });
      if (res.error || !res.data?.signedUrl) throw res.error || new Error('No URL');
      const a = new Audio(res.data.signedUrl);
      a.onended = () => stopPlayback();
      await a.play();
      setAudio(a);
      setPlayingId(t.id);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo reproducir el audio', variant: 'destructive' });
    }
  };

  const handleDownload = async (t: AdminTranscription) => {
    if (!t.audio_path) return;
    try {
      const sessionToken = await secureStorage.getAdminSession();
      const res = await supabase.functions.invoke('admin-get-transcriptions', {
        body: { sessionToken, action: 'signed_url', audioPath: t.audio_path },
      });
      if (res.error || !res.data?.signedUrl) throw res.error || new Error('No URL');
      const a = document.createElement('a');
      a.href = res.data.signedUrl;
      a.download = t.audio_path.split('/').pop() || 'audio';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      toast({ title: 'Error', description: 'No se pudo descargar', variant: 'destructive' });
    }
  };

  const handleDelete = async (t: AdminTranscription) => {
    if (!confirm('¿Eliminar esta transcripción y su audio?')) return;
    try {
      const sessionToken = await secureStorage.getAdminSession();
      const res = await supabase.functions.invoke('admin-get-transcriptions', {
        body: { sessionToken, action: 'delete', transcriptionId: t.id },
      });
      if (res.error) throw res.error;
      toast({ title: 'Eliminada', description: 'Transcripción eliminada' });
      await fetchAll();
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const filtered = items.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.text || '').toLowerCase().includes(q) ||
      (t.original_text || '').toLowerCase().includes(q) ||
      (t.corrected_text || '').toLowerCase().includes(q) ||
      (t.provider || '').toLowerCase().includes(q) ||
      (t.user_id || '').toLowerCase().includes(q)
    );
  });

  const withAudio = items.filter(i => i.audio_path).length;
  const validated = items.filter(i => i.is_validated === true).length;
  const corrected = items.filter(i => !!i.corrected_text).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted-foreground text-sm">
          Transcripciones generadas en el apartado <strong>Transcribir</strong> (separado de las grabaciones de entrenamiento).
        </p>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{filtered.length}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Con audio</p>
              <p className="text-2xl font-bold">{withAudio}</p>
            </div>
            <Play className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Validadas</p>
              <p className="text-2xl font-bold">{validated}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Corregidas</p>
              <p className="text-2xl font-bold">{corrected}</p>
            </div>
            <XCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por texto, proveedor, user_id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <div className="overflow-auto" style={{ maxHeight: 600 }}>
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Texto original</TableHead>
                <TableHead>Texto corregido / final</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(t.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{t.provider ?? '—'}</Badge>
                  </TableCell>
                  <TableCell>
                    {t.is_validated === true ? (
                      <Badge variant="default" className="text-xs"><CheckCircle className="w-3 h-3 mr-1" />OK</Badge>
                    ) : t.is_validated === false ? (
                      <Badge variant="destructive" className="text-xs"><XCircle className="w-3 h-3 mr-1" />Corregida</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Sin feedback</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm whitespace-pre-wrap break-words" title={t.original_text || ''}>
                      {t.original_text || <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {t.corrected_text ? (
                      <div className="text-sm whitespace-pre-wrap break-words text-foreground" title={t.corrected_text}>
                        {t.corrected_text}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">{t.text}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t.duration_seconds ? `${t.duration_seconds}s` : '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{formatBytes(t.file_size_bytes)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm"
                        disabled={!t.audio_path}
                        onClick={() => handlePlay(t)}
                        title={t.audio_path ? 'Reproducir' : 'Sin audio'}
                        className="h-9 px-3"
                      >
                        {playingId === t.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        disabled={!t.audio_path}
                        onClick={() => handleDownload(t)}
                        title="Descargar audio"
                        className="h-9 px-3"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleDelete(t)}
                        title="Eliminar"
                        className="h-9 px-3 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {filtered.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No hay transcripciones</h3>
          <p className="text-muted-foreground">Aún no se han guardado transcripciones del apartado Transcribir.</p>
        </div>
      )}
    </div>
  );
};
