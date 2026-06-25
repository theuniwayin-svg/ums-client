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
        <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pending reminders for leads you can access, due in the next 24 hours
        </p>
      </div>

      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))
      ) : followUpsList.length === 0 ? (
        <EmptyState
          icon="🎉"
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
          'border-l-4',
          urgency === 'overdue' && 'border-l-red-500 bg-red-50',
          urgency === 'today' && 'border-l-yellow-400 bg-yellow-50',
          urgency === 'upcoming' && 'border-l-gray-300',
        )}
      >
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {urgency === 'overdue' && (
                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    🔴 Overdue
                  </span>
                )}
                {urgency === 'today' && (
                  <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                    🟡 Today
                  </span>
                )}
              </div>
              {lead && (
                <Link
                  href={`/leads/${lead._id}`}
                  className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  {lead.studentName}
                </Link>
              )}
              <p className="text-sm text-gray-600 mt-0.5">
                {followUp.type} · {followUp.note || 'No note'}
              </p>
              {followUp.scheduledFor && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(followUp.scheduledFor), 'MMM d, h:mm a')}
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={completeFollowUp.isPending}
              className="flex-shrink-0 bg-green-600 hover:bg-green-700"
            >
              ✓ Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
