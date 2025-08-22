import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = "" 
}: EmptyStateProps) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        </div>
        {action && (
          <div className="pt-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};