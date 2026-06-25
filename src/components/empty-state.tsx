import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  cta?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  cta,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className,
      )}
    >
      <div className="p-4 rounded-full bg-muted mb-4">
        <Inbox className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {cta && (
        <Button
          onClick={cta.onClick}
          className="mt-4"
        >
          {cta.label}
        </Button>
      )}
    </div>
  );
}
