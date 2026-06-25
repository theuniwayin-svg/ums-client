import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700',
  Called: 'bg-purple-100 text-purple-700',
  Interested: 'bg-amber-100 text-amber-700',
  'Follow Up': 'bg-orange-100 text-orange-700',
  'Admission Confirmed': 'bg-green-100 text-green-700',
  'Not Interested': 'bg-gray-100 text-gray-600',
  Closed: 'bg-red-100 text-red-700',
};

const TEMPERATURE_STYLES: Record<string, string> = {
  Hot: 'bg-red-100 text-red-700',
  Warm: 'bg-amber-100 text-amber-700',
  Cold: 'bg-blue-100 text-blue-700',
};

const TEMPERATURE_ICONS: Record<string, string> = {
  Hot: '🔥',
  Warm: '☀️',
  Cold: '❄️',
};

const TEMPERATURE_BORDER: Record<string, string> = {
  Hot: 'border-l-red-500',
  Warm: 'border-l-amber-400',
  Cold: 'border-l-blue-400',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-700',
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
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        TEMPERATURE_STYLES[temperature] || 'bg-gray-100 text-gray-700',
      )}
    >
      {TEMPERATURE_ICONS[temperature]} {temperature}
    </span>
  );
}

export function temperatureBorderClass(temperature: string) {
  return TEMPERATURE_BORDER[temperature] || 'border-l-gray-300';
}

export function FollowUpDateBadge({ date }: { date?: string }) {
  if (!date) return <span className="text-gray-400 text-sm">—</span>;

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
        'text-sm',
        isOverdue && 'text-red-500 font-medium',
        isToday && 'text-yellow-600 font-medium',
        !isOverdue && !isToday && 'text-gray-500',
      )}
    >
      {isOverdue && '🔴 '}
      {isToday && '🟡 '}
      {followUpDate.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      })}
    </span>
  );
}
