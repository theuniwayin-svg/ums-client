'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePendingFollowUps, useCompleteFollowUp } from '@/hooks/use-leads';
import { EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

function getFollowUpUrgency(date: string) {
  const followUpDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const followUpDay = new Date(
    followUpDate.getFullYear(),
    followUpDate.getMonth(),
    followUpDate.getDate(),
  );

  if (followUpDay < today) return 'overdue';
  if (followUpDay.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

export default function FollowUpsPage() {
  const { data: followUps, isLoading } = usePendingFollowUps();
  const followUpsList = Array.isArray(followUps) ? followUps : [];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Follow-ups</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pending reminders for leads you can access, due in the next 24 hours
        </p>
      </div>

      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))
      ) : followUpsList.length === 0 ? (
        <EmptyState
          title="All caught up!"
          description="No reminders. Schedule a callback to stay on track."
        />
      ) : (
        <div className="space-y-3">
          {followUpsList.map((followUp: any, index: number) => {
            const urgency = followUp.scheduledFor
              ? getFollowUpUrgency(followUp.scheduledFor)
              : 'upcoming';
            const lead = followUp.leadId;

            return (
              <FollowUpCard
                key={followUp._id}
                followUp={followUp}
                lead={lead}
                urgency={urgency}
                index={index}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function FollowUpCard({
  followUp,
  lead,
  urgency,
  index,
}: {
  followUp: any;
  lead: any;
  urgency: string;
  index: number;
}) {
  const completeFollowUp = useCompleteFollowUp(lead?._id || '');

  const handleComplete = async () => {
    try {
      await completeFollowUp.mutateAsync(followUp._id);
      toast.success('Follow-up marked complete!');
    } catch {
      toast.error('Failed to complete follow-up');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'border-l-4 transition-all duration-200',
          urgency === 'overdue' && 'border-l-rose-500 bg-rose-500/5 dark:bg-rose-500/10 hover:bg-rose-500/10',
          urgency === 'today' && 'border-l-amber-400 bg-amber-500/5 dark:bg-amber-500/10 hover:bg-amber-500/10',
          urgency === 'upcoming' && 'border-l-slate-300 dark:border-l-slate-600 hover:bg-muted/50',
        )}
      >
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {urgency === 'overdue' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-500/20 px-2.5 py-1 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" /> Overdue
                  </span>
                )}
                {urgency === 'today' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-500/20 px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" /> Today
                  </span>
                )}
              </div>
              {lead && (
                <Link
                  href={`/leads/${lead._id}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {lead.studentName}
                </Link>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">
                {followUp.type} · {followUp.note || 'No note'}
              </p>
              {followUp.scheduledFor && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {format(new Date(followUp.scheduledFor), 'MMM d, h:mm a')}
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={completeFollowUp.isPending}
              className="flex-shrink-0 gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
