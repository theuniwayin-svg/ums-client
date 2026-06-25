'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useLead,
  useUpdateLead,
  useCloseLead,
  useLeadActivities,
  useLeadNotes,
  useLeadFollowUps,
  useCreateNote,
  useCreateFollowUp,
  useCompleteFollowUp,
} from '@/hooks/use-leads';
import {
  StatusBadge,
  TemperatureBadge,
  FollowUpDateBadge,
  temperatureBorderClass,
} from '@/components/leads/status-badges';
import { EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/utils';

const STATUS_FLOW = [
  'New', 'Called', 'Interested', 'Follow Up', 'Admission Confirmed',
];
const EXIT_STATUSES = ['Not Interested', 'Closed'];
const TEMPERATURE_OPTIONS = ['Hot', 'Warm', 'Cold'];
const ACTIVITY_ICONS: Record<string, string> = {
  LEAD_CREATED: '➕',
  STATUS_CHANGED: '🔄',
  TEMPERATURE_CHANGED: '🌡️',
  NOTE_ADDED: '📝',
  FOLLOW_UP_SCHEDULED: '🔔',
  FOLLOW_UP_COMPLETED: '✅',
  LEAD_UPDATED: '✏️',
  DUPLICATE_OVERRIDE: '⚠️',
  LEAD_CLOSED: '🔒',
  LEAD_DELETED: '🗑️',
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: lead, isLoading } = useLead(id);
  const { data: activitiesPages, fetchNextPage, hasNextPage } = useLeadActivities(id);
  const { data: notes } = useLeadNotes(id);
  const { data: followUps } = useLeadFollowUps(id);

  const updateLead = useUpdateLead(id);
  const closeLead = useCloseLead();
  const createNote = useCreateNote(id);
  const completeFollowUp = useCompleteFollowUp(id);

  const activities = activitiesPages?.pages.flatMap((p: any) => p?.data || p) || [];

  const handleStatusChange = async (status: string) => {
    if (!lead) return;
    try {
      setIsSaving(true);
      await updateLead.mutateAsync({ version: lead.version, status });
      toast.success(`Status → ${status}`);
    } catch (err: any) {
      if (err.response?.data?.error?.code === 'VERSION_CONFLICT') {
        toast.error(
          'This lead was updated by someone else. Refreshing...',
        );
      } else {
        toast.error('Failed to update status');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemperatureChange = async (temperature: string) => {
    if (!lead) return;
    try {
      await updateLead.mutateAsync({ version: lead.version, temperature });
      toast.success(`Temperature → ${temperature}`);
    } catch {
      toast.error('Failed to update temperature');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await createNote.mutateAsync(newNote.trim());
      setNewNote('');
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    }
  };

  const handleCloseLead = async () => {
    try {
      await closeLead.mutateAsync(id);
      toast.success('Lead closed');
      router.push('/leads');
    } catch {
      toast.error('Failed to close lead');
    }
  };

  if (isLoading || !lead) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{lead.studentName}</h1>
          <p className="text-gray-500 font-mono">{lead.phone}</p>
        </div>
        <div className="flex items-center gap-3">
          <TemperatureBadge temperature={lead.temperature} />
          <AlertDialog>
            <AlertDialogTrigger>
              <Button variant="destructive" size="sm">
                Close Lead
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close this lead?</AlertDialogTitle>
                <AlertDialogDescription>
                  It will be marked Closed and removed from active views. You
                  can find it again by filtering for Closed leads.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCloseLead}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Close Lead
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Status stepper */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Status</p>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FLOW.map((status, index) => {
              const currentIndex = STATUS_FLOW.indexOf(lead.status);
              const isCompleted = index < currentIndex;
              const isCurrent = lead.status === status;
              return (
                <div key={status} className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(status)}
                    disabled={isSaving}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border-2',
                      isCompleted &&
                        'bg-indigo-100 text-indigo-700 border-indigo-300',
                      isCurrent &&
                        'bg-indigo-600 text-white border-indigo-600 shadow-md',
                      !isCompleted &&
                        !isCurrent &&
                        'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600',
                    )}
                  >
                    {isCompleted && '✓ '}
                    {status}
                  </button>
                  {index < STATUS_FLOW.length - 1 && (
                    <span className="text-gray-300">→</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-3">
            {EXIT_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={isSaving}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium border transition-all',
                  lead.status === status
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-red-200 text-red-500 hover:bg-red-50',
                )}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Temperature */}
          <Separator className="my-4" />
          <p className="text-sm font-medium text-gray-700 mb-2">Temperature</p>
          <div className="flex gap-2">
            {TEMPERATURE_OPTIONS.map((t) => (
              <Button
                key={t}
                variant={lead.temperature === t ? 'default' : 'outline'}
                size="sm"
                className={lead.temperature === t ? 'bg-indigo-600' : ''}
                onClick={() => handleTemperatureChange(t)}
              >
                {t === 'Hot' ? '🔥' : t === 'Warm' ? '☀️' : '❄️'} {t}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {lead.email && (
              <div>
                <span className="text-gray-500">Email</span>
                <p className="font-medium">{lead.email}</p>
              </div>
            )}
            {lead.parentPhone && (
              <div>
                <span className="text-gray-500">Parent Phone</span>
                <p className="font-medium font-mono">{lead.parentPhone}</p>
              </div>
            )}
            {(lead.city || lead.state) && (
              <div>
                <span className="text-gray-500">Location</span>
                <p className="font-medium">
                  {[lead.city, lead.state].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
            {lead.course && (
              <div>
                <span className="text-gray-500">Course</span>
                <p className="font-medium">{lead.course}</p>
              </div>
            )}
            {lead.preferredCollege && (
              <div>
                <span className="text-gray-500">Preferred College</span>
                <p className="font-medium">{lead.preferredCollege}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500">Source</span>
              <p className="font-medium">
                {lead.source}
                {lead.otherSourceDescription &&
                  ` — ${lead.otherSourceDescription}`}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Created By</span>
              <p className="font-medium">
                {typeof lead.createdBy === 'object'
                  ? lead.createdBy.name
                  : lead.createdBy}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Assigned To</span>
              <p className="font-medium">
                {typeof lead.assignedTo === 'object'
                  ? lead.assignedTo.name
                  : lead.assignedTo || 'Unassigned'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                maxLength={2000}
                rows={3}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                  {newNote.length}/2000
                </span>
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || createNote.isPending}
                  className="bg-indigo-600"
                >
                  Add Note
                </Button>
              </div>
            </div>
            <Separator />
            {!notes || (notes as any[]).length === 0 ? (
              <EmptyState
                icon="📝"
                title="No notes"
                description="No notes for this lead. Add context for your team."
              />
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {(notes as any[]).map((note: any) => (
                  <div
                    key={note._id}
                    className="bg-gray-50 rounded-lg p-3 text-sm"
                  >
                    <p className="text-gray-800">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {note.createdByName} ·{' '}
                      {format(new Date(note.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No activity yet"
                description="This is where every change to this lead will appear."
              />
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {activities.map((activity: any, index: number) => (
                  <motion.div
                    key={activity._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex gap-3 text-sm"
                  >
                    <span className="text-base flex-shrink-0">
                      {ACTIVITY_ICONS[activity.actionType] || '📌'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 font-medium truncate">
                        {activity.performedByName}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {activity.actionType.replace(/_/g, ' ').toLowerCase()}
                        {activity.fieldChanged &&
                          ` · ${activity.fieldChanged}`}
                        {activity.previousValue !== undefined &&
                          activity.newValue !== undefined &&
                          ` · ${activity.previousValue} → ${activity.newValue}`}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {hasNextPage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-gray-500"
                    onClick={() => fetchNextPage()}
                  >
                    Load more
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
