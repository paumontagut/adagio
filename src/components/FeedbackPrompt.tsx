import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveFeedback, type FeedbackProvider } from '@/services/feedback';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackPromptProps {
  provider: FeedbackProvider;
  predictedText: string;
  audioBlob?: Blob | null;
  durationSec?: number | null;
  onSubmitted?: (pointsAwarded: number) => void;
  compact?: boolean;
}

type Stage = 'prompt' | 'correcting' | 'submitting' | 'done';

export const FeedbackPrompt = ({
  provider,
  predictedText,
  audioBlob,
  durationSec,
  onSubmitted,
  compact = false,
}: FeedbackPromptProps) => {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>('prompt');
  const [correction, setCorrection] = useState('');

  if (!user) return null;

  const handleSubmit = async (isCorrect: boolean, correctedText?: string) => {
    setStage('submitting');
    try {
      const res = await saveFeedback({
        provider,
        predictedText,
        isCorrect,
        correctedText: correctedText ?? null,
        audioBlob: audioBlob ?? null,
        durationSec: durationSec ?? null,
      });
      setStage('done');
      onSubmitted?.(res.pointsAwarded);
      toast.success(`+${res.pointsAwarded} puntos 🎉`, {
        description: correctedText
          ? '¡Gracias por tu corrección!'
          : 'Gracias por validar la transcripción.',
      });
    } catch (err) {
      console.error('Feedback error:', err);
      setStage('prompt');
      toast.error('No se pudo guardar tu feedback', {
        description: err instanceof Error ? err.message : 'Inténtalo de nuevo.',
      });
    }
  };

  if (stage === 'done') {
    return (
      <Card className={`p-4 bg-primary/5 border-primary/20 ${compact ? '' : 'animate-in fade-in slide-in-from-bottom-2'}`}>
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium">¡Gracias por tu feedback!</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 space-y-3 ${compact ? '' : 'animate-in fade-in slide-in-from-bottom-2'}`}>
      {stage === 'prompt' && (
        <>
          <p className="text-sm text-foreground">
            ¿Has querido decir esto?
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleSubmit(true)}
              className="flex-1"
              aria-label="Sí, la transcripción es correcta"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Sí, correcto
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStage('correcting')}
              className="flex-1"
              aria-label="No, quiero corregirlo"
            >
              <X className="h-4 w-4 mr-1.5" />
              No
            </Button>
          </div>
        </>
      )}

      {stage === 'correcting' && (
        <>
          <p className="text-sm font-medium">¿Qué has querido decir?</p>
          <Textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="Escribe lo que realmente quisiste decir…"
            className="min-h-[80px] resize-y"
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleSubmit(false, correction)}
              disabled={!correction.trim()}
            >
              Guardar corrección (+15 pts)
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSubmit(false)}
            >
              Saltar (+5 pts)
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStage('prompt')}
            >
              Cancelar
            </Button>
          </div>
        </>
      )}

      {stage === 'submitting' && (
        <div className="flex items-center justify-center py-3 gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Guardando feedback…
        </div>
      )}
    </Card>
  );
};
