import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { transcribeService } from '@/services/transcribe';

export interface BackendStatusProps {
  onStatusChange?: (online: boolean) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const BackendStatus = ({ 
  onStatusChange, 
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: BackendStatusProps) => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setStatus('checking');
    setError(null);
    
    try {
      const result = await transcribeService.ping();
      const newStatus = result.online ? 'online' : 'offline';
      setStatus(newStatus);
      setLastCheck(new Date());
      
      if (!result.online && result.error) {
        setError(result.error);
      }
      
      onStatusChange?.(result.online);
    } catch (error) {
      setStatus('offline');
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setLastCheck(new Date());
      onStatusChange?.(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkStatus();

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(checkStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          variant: 'default' as const,
          icon: Wifi,
          text: 'Online',
          className: 'bg-success text-success-foreground border-success/20'
        };
      case 'offline':
        return {
          variant: 'destructive' as const,
          icon: WifiOff,
          text: 'Offline',
          className: 'bg-destructive text-destructive-foreground'
        };
      case 'checking':
        return {
          variant: 'secondary' as const,
          icon: Loader2,
          text: 'Verificando...',
          className: 'bg-muted text-muted-foreground'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-2">
      <Badge 
        variant={config.variant}
        className={`flex items-center gap-2 px-3 py-1 ${config.className}`}
        onClick={checkStatus}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            checkStatus();
          }
        }}
        aria-label={`Estado del servidor: ${config.text}. Clic para actualizar.`}
      >
        <Icon 
          className={`h-3 w-3 ${status === 'checking' ? 'animate-spin' : ''}`} 
        />
        <span className="text-sm font-medium">{config.text}</span>
      </Badge>
      
      {lastCheck && (
        <p className="text-xs text-muted-foreground text-center">
          Última verificación: {lastCheck.toLocaleTimeString()}
        </p>
      )}
      
      {error && status === 'offline' && (
        <p className="text-xs text-destructive text-center max-w-xs">
          {error}
        </p>
      )}
    </div>
  );
};