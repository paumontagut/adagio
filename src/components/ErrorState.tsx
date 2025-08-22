import { AlertCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorStateProps {
  title: string;
  description: string;
  solution?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = ({ 
  title, 
  description, 
  solution,
  onRetry,
  className = "" 
}: ErrorStateProps) => {
  return (
    <Card className={`p-6 border-destructive/20 bg-destructive/5 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <h4 className="font-medium text-destructive">
            {title}
          </h4>
          <p className="text-sm text-foreground">
            {description}
          </p>
          {solution && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-background rounded-md border">
              <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">
                <strong>Solución:</strong> {solution}
              </p>
            </div>
          )}
          {onRetry && (
            <div className="pt-2">
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
              >
                Intentar de nuevo
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};