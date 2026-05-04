import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Square, Trash2, Calendar, Mic, ArrowLeft, CheckCircle2, XCircle, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  listMyTranscriptions,
  deleteTranscription,
  getTranscriptionAudioUrl,
  type MyTranscriptionRow,
} from '@/services/transcriptionStore';

export const MyTranscriptions = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<MyTranscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await listMyTranscriptions();
      setItems(rows);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar las transcripciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);

  const handlePlay = async (item: MyTranscriptionRow) => {
    if (!item.audio_path) {
      toast.info('Esta transcripción no tiene audio guardado');
      return;
    }
    if (playingId === item.id && audioEl) {
      audioEl.pause();
      setAudioEl(null);
      setPlayingId(null);
      return;
    }
    if (audioEl) { audioEl.pause(); setAudioEl(null); }
    const url = await getTranscriptionAudioUrl(item.audio_path);
    if (!url) { toast.error('No se pudo obtener el audio'); return; }
    const a = new Audio(url);
    a.onended = () => { setAudioEl(null); setPlayingId(null); };
    a.onerror = () => { setAudioEl(null); setPlayingId(null); toast.error('Error reproduciendo audio'); };
    setAudioEl(a);
    setPlayingId(item.id);
    a.play().catch(() => {});
  };

  const handleDelete = async (item: MyTranscriptionRow) => {
    if (!confirm('¿Borrar esta transcripción y su audio?')) return;
    try {
      await deleteTranscription(item.id, item.audio_path);
      setItems(prev => prev.filter(x => x.id !== item.id));
      toast.success('Transcripción borrada');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo borrar');
    }
  };

  const providerLabel = (p: string | null) => p === 'openai' ? 'ChatGPT' : 'Adagio';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Volver</Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-semibold flex-1">Mis transcripciones</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          Aquí se guardan los textos (y, si tienes el consentimiento de uso de datos activado, también los audios) que generas en el apartado <strong>Transcribir</strong>.
        </p>

        {items.length === 0 ? (
          <Card className="p-10 text-center bg-white/60 backdrop-blur-xl border-white/40">
            <Mic className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aún no tienes transcripciones guardadas.</p>
            <Button className="mt-4" asChild><Link to="/">Transcribir audio</Link></Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <Card key={item.id} className="p-4 md:p-5 bg-white/60 backdrop-blur-xl border-white/40 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(item.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                  <Badge variant="secondary" className="ml-auto">{providerLabel(item.provider)}</Badge>
                  {item.is_validated === true && (
                    <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Validada</Badge>
                  )}
                  {item.is_validated === false && item.corrected_text && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Edit3 className="h-3 w-3 mr-1" />Corregida</Badge>
                  )}
                  {item.is_validated === false && !item.corrected_text && (
                    <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Marcada incorrecta</Badge>
                  )}
                </div>

                <p className="text-base whitespace-pre-wrap">{item.text}</p>

                {item.corrected_text && item.original_text && item.original_text !== item.text && (
                  <div className="text-xs text-muted-foreground border-l-2 border-muted pl-3">
                    <span className="font-medium">Original del modelo:</span> {item.original_text}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlay(item)}
                    disabled={!item.audio_path}
                    title={!item.audio_path ? 'Audio no guardado (requiere consentimiento de uso de datos)' : ''}
                  >
                    {playingId === item.id
                      ? <><Square className="h-4 w-4 mr-1" />Detener</>
                      : <><Play className="h-4 w-4 mr-1" />Escuchar audio</>}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item)}>
                    <Trash2 className="h-4 w-4 mr-1" />Borrar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTranscriptions;
