'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  useUpdateLeadStatus,
  useUpdateLeadTemperature,
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
import { LeadInfoEditor } from '@/components/leads/lead-info-editor';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useAuthStore } from '@/store/auth.store';
import { SHORTCUT_GROUPS } from '@/lib/keyboard-shortcuts';
import {
  ArrowLeft,
  Flame,
  Sun,
  Snowflake,
  CheckCircle2,
  ChevronRight,
  Phone,
  MessageSquare,
} from 'lucide-react';

const STATUS_FLOW = [
  'New', 'Called', 'Interested', 'Follow Up', 'Admission Confirmed',
];
const EXIT_STATUSES = ['Not Interested', 'Closed'];
const TEMPERATURE_OPTIONS = ['Hot', 'Warm', 'Cold'];
const FOLLOW_UP_TYPES = ['Call', 'Documents Pending', 'Parent Callback', 'General'];

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  LEAD_CREATED: 'Lead created',
  STATUS_CHANGED: 'Status changed',
  TEMPERATURE_CHANGED: 'Temperature changed',
  NOTE_ADDED: 'Note added',
  FOLLOW_UP_SCHEDULED: 'Follow-up scheduled',
  FOLLOW_UP_COMPLETED: 'Follow-up completed',
  LEAD_UPDATED: 'Lead updated',
  DUPLICATE_OVERRIDE: 'Duplicate override',
  LEAD_CLOSED: 'Lead closed',
  LEAD_DELETED: 'Lead deleted',
};

const TEMP_CONFIG: Record<string, { icon: React.ReactNode; active: string; inactive: string }> = {
  Hot:  { icon: <Flame className="w-3.5 h-3.5" />, active: 'bg-rose-500 text-white border-rose-500',  inactive: 'border-rose-200 text-rose-500 dark:border-rose-800 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950' },
  Warm: { icon: <Sun className="w-3.5 h-3.5" />,  active: 'bg-amber-500 text-white border-amber-500', inactive: 'border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950' },
  Cold: { icon: <Snowflake className="w-3.5 h-3.5" />, active: 'bg-cyan-500 text-white border-cyan-500', inactive: 'border-cyan-200 text-cyan-600 dark:border-cyan-800 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950' },
};

function formatActivityValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((item) => formatActivityValue(item)).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nestedValue]) => `${key}: ${formatActivityValue(nestedValue)}`)
      .join(', ');
  }
  return String(value);
}

function prettyFieldName(field: string) {
  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [followUpType, setFollowUpType] = useState(FOLLOW_UP_TYPES[0]);
  const [followUpScheduledFor, setFollowUpScheduledFor] = useState(() => {
    const nextHour = new Date(Date.now() + 60 * 60 * 1000);
    const offset = nextHour.getTimezoneOffset() * 60000;
    return new Date(nextHour.getTime() - offset).toISOString().slice(0, 16);
  });
  const [followUpNote, setFollowUpNote] = useState('');

  const { data: lead, isLoading, isError, error: leadError } = useLead(id);
  const { data: activitiesPages, fetchNextPage, hasNextPage } = useLeadActivities(id);
  const { data: notes } = useLeadNotes(id);

  const updateLeadStatus = useUpdateLeadStatus(id);
  const updateLeadTemperature = useUpdateLeadTemperature(id);
  const closeLead = useCloseLead();
  const createNote = useCreateNote(id);
  const createFollowUp = useCreateFollowUp(id);

  const activities = useMemo(() => {
    const allActivities = activitiesPages?.pages.flatMap((p: any) => p?.data || p) || [];
    const seen = new Set<string>();
    return allActivities.filter((activity: any) => {
      if (!activity?._id || seen.has(activity._id)) return false;
      seen.add(activity._id);
      return true;
    });
  }, [activitiesPages]);

  const handleStatusChange = async (status: string) => {
    if (!lead) return;
    try {
      setIsSaving(true);
      await updateLeadStatus.mutateAsync({ version: lead.version, status });
      toast.success(`Status → ${status}`);
    } catch (err: any) {
      if (err.response?.data?.error?.code === 'VERSION_CONFLICT') {
        toast.error('This lead was updated by someone else. Refreshing…');
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
      await updateLeadTemperature.mutateAsync({ version: lead.version, temperature });
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

  const handleCreateFollowUp = async () => {
    try {
      await createFollowUp.mutateAsync({
        type: followUpType,
        scheduledFor: new Date(followUpScheduledFor).toISOString(),
        note: followUpNote.trim() || undefined,
      });
      toast.success('Follow-up scheduled');
      setIsFollowUpOpen(false);
      setFollowUpNote('');
    } catch {
      toast.error('Failed to schedule follow-up');
    }
  };

  useKeyboardShortcuts(
    {
      f: () => setIsFollowUpOpen(true),
      '?': () => setIsShortcutHelpOpen(true),
      Escape: () => {
        setIsFollowUpOpen(false);
        setIsShortcutHelpOpen(false);
      },
    },
    !!lead,
  );

  // ── Access denied / not found ──────────────────────────────────────────────
  if (isError) {
    const status = (leadError as any)?.response?.status;
    const isAccessDenied = status === 403 || status === 404;
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4 px-4">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <ArrowLeft className="w-6 h-6 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          {isAccessDenied ? 'Access Removed' : 'Lead Not Found'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAccessDenied
            ? 'You no longer have access to this lead. It may have been unassigned from you.'
            : 'This lead could not be found. It may have been deleted or the link is invalid.'}
        </p>
        <button
          onClick={() => router.push('/leads')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </button>
      </div>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading || !lead) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto px-0 sm:px-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const phone = lead.phone || '';
  const phoneDigits = phone.replace(/[^0-9+]/g, '');
  const waUrl = `https://wa.me/${phoneDigits.replace(/^\+/, '')}`;

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Name + phone + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                {lead.studentName}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-sm text-muted-foreground font-mono">{lead.phone}</p>
                {/* Quick call / WA on mobile */}
                <div className="flex items-center gap-2 sm:hidden">
                  <a
                    href={`tel:${phoneDigits}`}
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-medium"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFollowUpOpen(true)}
                className="text-xs h-8"
              >
                Schedule Follow-up
              </Button>
              <TemperatureBadge temperature={lead.temperature} />
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 h-8"
                      >
                        Close Lead
                      </button>
                    }
                  />
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
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Close Lead
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* ── Status stepper ──────────────────────────────────────────────── */}
        <Card className={cn('border-l-4', temperatureBorderClass(lead.temperature))}>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Pipeline Status
            </p>

            {/* Scrollable stepper on mobile */}
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <div className="flex items-center gap-1.5 min-w-max">
                {STATUS_FLOW.map((status, index) => {
                  const currentIndex = STATUS_FLOW.indexOf(lead.status);
                  const isCompleted = index < currentIndex;
                  const isCurrent = lead.status === status;
                  return (
                    <div key={status} className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStatusChange(status)}
                        disabled={isSaving}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border-2 whitespace-nowrap',
                          isCompleted && 'bg-primary/10 text-primary border-primary/30',
                          isCurrent && 'bg-primary text-primary-foreground border-primary shadow-md',
                          !isCompleted && !isCurrent && 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground',
                        )}
                      >
                        {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                        {status}
                      </button>
                      {index < STATUS_FLOW.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exit statuses */}
            <div className="flex gap-2 mt-3">
              {EXIT_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isSaving}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                    lead.status === status
                      ? 'bg-destructive text-destructive-foreground border-destructive'
                      : 'border-destructive/30 text-destructive hover:bg-destructive/10 dark:border-destructive/50',
                  )}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Temperature */}
            <Separator className="my-4" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Temperature
            </p>
            <div className="flex gap-2">
              {TEMPERATURE_OPTIONS.map((t) => {
                const cfg = TEMP_CONFIG[t];
                const isActive = lead.temperature === t;
                return (
                  <Button
                    key={t}
                    variant="outline"
                    size="sm"
                    className={cn(
                      'flex-1 sm:flex-none gap-1.5 text-xs h-8 border-2 transition-all',
                      isActive ? cfg.active : cfg.inactive,
                    )}
                    onClick={() => handleTemperatureChange(t)}
                  >
                    {cfg.icon} {t}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Lead info card ──────────────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-5">
            <LeadInfoEditor
              lead={lead}
              title="Lead Information"
              description="Edit the lead profile and keep the activity trail in sync."
              showAssignedTo={isAdmin}
            />
          </CardContent>
        </Card>

        {/* ── Notes + Activity ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note…"
                  maxLength={2000}
                  rows={3}
                  className="text-sm resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    {newNote.length}/2000
                  </span>
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || createNote.isPending}
                    className="h-7 text-xs"
                  >
                    Add Note
                  </Button>
                </div>
              </div>
              <Separator />
              {!notes || (notes as any[]).length === 0 ? (
                <EmptyState
                  title="No notes"
                  description="Add context for your team."
                />
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto scroll-ios">
                  {(notes as any[]).map((note: any) => (
                    <div
                      key={note._id}
                      className="bg-muted rounded-lg p-3 text-sm border border-border"
                    >
                      <p className="text-foreground">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
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
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  description="Every change to this lead will appear here."
                />
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto scroll-ios">
                  {activities.map((activity: any, index: number) => (
                    <motion.div
                      key={activity._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex gap-2.5 text-sm"
                    >
                      {/* Dot indicator */}
                      <div className="flex flex-col items-center flex-shrink-0 pt-1">
                        <div className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
                        {index < activities.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1 min-h-[12px]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-2">
                        <p className="text-foreground font-medium text-xs truncate">
                          {activity.performedByName}
                          <span className="text-muted-foreground font-normal ml-1.5">
                            {ACTIVITY_ACTION_LABELS[activity.actionType] || activity.actionType.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        </p>
                        {activity.fieldChanged && (
                          <p className="text-muted-foreground text-xs mt-0.5">
                            Field: {activity.fieldChanged}
                          </p>
                        )}
                        {activity.previousValue !== undefined &&
                          activity.newValue !== undefined &&
                          typeof activity.previousValue !== 'object' &&
                          typeof activity.newValue !== 'object' && (
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {formatActivityValue(activity.previousValue)} → {formatActivityValue(activity.newValue)}
                          </p>
                        )}
                        {activity.previousValue !== undefined &&
                          activity.newValue !== undefined &&
                          (typeof activity.previousValue === 'object' || typeof activity.newValue === 'object') && (
                          <div className="mt-1 rounded-lg bg-muted px-2 py-1.5 text-xs text-muted-foreground space-y-0.5">
                            {(() => {
                              const changedFields = String(activity.fieldChanged || '')
                                .split(',')
                                .map((field) => field.trim())
                                .filter(Boolean);
                              const previousValues =
                                activity.previousValue && typeof activity.previousValue === 'object'
                                  ? (activity.previousValue as Record<string, unknown>)
                                  : {};
                              const newValues =
                                activity.newValue && typeof activity.newValue === 'object'
                                  ? (activity.newValue as Record<string, unknown>)
                                  : {};
                              const fieldsToRender =
                                changedFields.length > 0
                                  ? changedFields
                                  : Object.keys({ ...previousValues, ...newValues });
                              return fieldsToRender.map((field) => (
                                <div key={field} className="flex flex-wrap gap-1">
                                  <span className="font-medium text-foreground">{prettyFieldName(field)}:</span>
                                  <span>{formatActivityValue(previousValues[field])} → {formatActivityValue(newValues[field])}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                        <p className="text-muted-foreground/70 text-[10px] mt-0.5">
                          {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {hasNextPage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground text-xs"
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

      {/* ── Dialogs rendered at page root (NOT inside cards) ─────────────── */}

      {/* Follow-up dialog */}
      <Dialog open={isFollowUpOpen} onOpenChange={setIsFollowUpOpen}>
        <DialogContent className="max-w-lg mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Schedule follow-up</DialogTitle>
            <DialogDescription>
              Create a reminder for this lead. It will show up on the follow-ups page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={followUpType} onValueChange={(v) => v && setFollowUpType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select follow-up type" />
                </SelectTrigger>
                <SelectContent>
                  {FOLLOW_UP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="follow-up-scheduled-for">Date and time</Label>
              <Input
                id="follow-up-scheduled-for"
                type="datetime-local"
                value={followUpScheduledFor}
                onChange={(event) => setFollowUpScheduledFor(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="follow-up-note">Note</Label>
              <Textarea
                id="follow-up-note"
                value={followUpNote}
                onChange={(event) => setFollowUpNote(event.target.value)}
                rows={3}
                placeholder="Optional reminder note"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsFollowUpOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFollowUp}
              disabled={createFollowUp.isPending}
            >
              Save follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard shortcuts dialog */}
      <Dialog open={isShortcutHelpOpen} onOpenChange={setIsShortcutHelpOpen}>
        <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>
              Quick actions for the lead detail screen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {group.items
                    .filter((item) => item.context === 'Everywhere' || item.context === 'Lead detail page')
                    .map((item) => (
                      <div
                        key={`${group.title}-${item.key}`}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground">{item.context}</p>
                        </div>
                        <kbd className="rounded border border-border bg-card px-2 py-0.5 font-mono text-xs">
                          {item.key}
                        </kbd>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShortcutHelpOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
