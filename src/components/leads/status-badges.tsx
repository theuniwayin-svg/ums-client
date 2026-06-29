import { cn } from '@/lib/utils';
import { Flame, Sun, Snowflake, AlertCircle, CheckCircle } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  New: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  Called: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  Interested: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  'Follow Up': 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
  'Admission Confirmed': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  'Not Interested': 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800',
  Closed: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
};

const TEMPERATURE_STYLES: Record<string, string> = {
  Hot: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
  Warm: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  Cold: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800',
};

const TEMPERATURE_ICONS: Record<string, React.ReactNode> = {
  Hot: <Flame className="w-3.5 h-3.5" />,
  Warm: <Sun className="w-3.5 h-3.5" />,
  Cold: <Snowflake className="w-3.5 h-3.5" />,
};

const TEMPERATURE_BORDER: Record<string, string> = {
  Hot: 'border-l-rose-500',
  Warm: 'border-l-amber-400',
  Cold: 'border-l-cyan-400',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      )}
    >
      {status}
    </span>
  );
}

export function TemperatureBadge({ temperature }: { temperature: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        TEMPERATURE_STYLES[temperature] || 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800',
      )}
    >
      {TEMPERATURE_ICONS[temperature]} {temperature}
    </span>
  );
}

export function temperatureBorderClass(temperature: string) {
  return TEMPERATURE_BORDER[temperature] || 'border-l-gray-300 dark:border-l-gray-700';
}

export function FollowUpDateBadge({ date }: { date?: string }) {
  if (!date) return <span className="text-muted-foreground text-sm">—</span>;

  const followUpDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const followUpDay = new Date(
    followUpDate.getFullYear(),
    followUpDate.getMonth(),
    followUpDate.getDate(),
  );

  const isOverdue = followUpDay < today;
  const isToday = followUpDay.getTime() === today.getTime();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium',
        isOverdue && 'text-rose-600 dark:text-rose-400',
        isToday && 'text-amber-600 dark:text-amber-400',
        !isOverdue && !isToday && 'text-slate-600 dark:text-slate-400',
      )}
    >
      {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
      {isToday && <CheckCircle className="w-3.5 h-3.5" />}
      {followUpDate.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      })}
    </span>
  );
}
