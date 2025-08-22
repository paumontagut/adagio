import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, HardDrive, Volume2, AlertTriangle, CheckCircle } from 'lucide-react';
import { AudioMetrics } from '@/lib/audioProcessor';

interface AudioMetricsDisplayProps {
  metrics: AudioMetrics;
  isValid: boolean;
  warnings: string[];
}

export const AudioMetricsDisplay = ({ metrics, isValid, warnings }: AudioMetricsDisplayProps) => {
  const formatDuration = (seconds: number): string => {
    return `${seconds.toFixed(1)}s`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getQualityBadge = () => {
    if (!isValid) {
      return <Badge variant="destructive">No válido</Badge>;
    }
    
    if (warnings.length > 0) {
      return <Badge variant="secondary" className="bg-warning text-warning-foreground">Mejorable</Badge>;
    }
    
    return <Badge variant="secondary" className="bg-success text-success-foreground">Buena calidad</Badge>;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-foreground">Información del Audio</h4>
        {getQualityBadge()}
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Duration */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Duración</p>
            <p className="text-sm font-medium">{formatDuration(metrics.duration)}</p>
          </div>
        </div>

        {/* File Size */}
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Tamaño</p>
            <p className="text-sm font-medium">{formatFileSize(metrics.size)}</p>
          </div>
        </div>

        {/* Audio Level */}
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Nivel</p>
            <p className="text-sm font-medium">
              {metrics.rmsLevel > 0.1 ? 'Alto' : metrics.rmsLevel > 0.05 ? 'Medio' : 'Bajo'}
            </p>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="text-xs text-muted-foreground mb-3">
        {metrics.sampleRate / 1000} kHz • {metrics.channels} canal{metrics.channels > 1 ? 'es' : ''}
        {metrics.peakLevel >= 0.98 && ' • ⚠️ Posible saturación'}
      </div>

      {/* Warnings and Tips */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <div 
              key={index}
              className={`flex items-start gap-2 p-2 rounded-md text-sm ${
                isValid 
                  ? 'bg-warning/10 text-warning-foreground' 
                  : 'bg-destructive/10 text-destructive-foreground'
              }`}
            >
              {isValid ? (
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              )}
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Success message */}
      {isValid && warnings.length === 0 && (
        <div className="flex items-center gap-2 p-2 bg-success/10 text-success-foreground rounded-md text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>Audio listo para enviar</span>
        </div>
      )}
    </Card>
  );
};