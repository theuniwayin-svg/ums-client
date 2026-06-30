'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadInfoEditor } from '@/components/leads/lead-info-editor';
import {
  useLead,
  useUpdateLeadStatus,
  useUpdateLeadTemperature,
  useCreateNote,
} from '@/hooks/use-leads';
import { StatusBadge, TemperatureBadge } from './status-badges';

const STATUS_OPTIONS = [
  'New', 'Called', 'Interested', 'Follow Up',
  'Admission Confirmed', 'Not Interested',
];
const TEMPERATURE_OPTIONS = ['Hot', 'Warm', 'Cold'];

interface QuickEditDrawerProps {
  open: boolean;
  leadId: string | null;
  onClose: () => void;
}

export function QuickEditDrawer({ open, leadId, onClose }: QuickEditDrawerProps) {
  const { data: lead, isLoading } = useLead(leadId || '');
  const updateLeadStatus = useUpdateLeadStatus(leadId || '');
  const updateLeadTemperature = useUpdateLeadTemperature(leadId || '');
  const createNote = useCreateNote(leadId || '');
  const [note, setNote] = useState('');

  const handleStatusChange = async (status: string) => {
    if (!lead) return;
    try {
      await updateLeadStatus.mutateAsync({ version: lead.version, status });
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleTemperatureChange = async (temperature: string) => {
    if (!lead) return;
    try {
      await updateLeadTemperature.mutateAsync({ version: lead.version, temperature });
      toast.success('Temperature updated');
    } catch {
      toast.error('Failed to update temperature');
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await createNote.mutateAsync(note.trim());
      toast.success('Note added');
      setNote('');
    } catch {
      toast.error('Failed to add note');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-96 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <SheetHeader className="mb-4">
            <SheetTitle>Quick Edit</SheetTitle>
          </SheetHeader>

          {isLoading || !lead ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <LeadInfoEditor
                lead={lead}
                layout="compact"
                title="Lead Information"
                description="Edit the core fields without leaving quick edit."
              />

              {/* Status */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <Button
                      key={s}
                      variant={lead.status === s ? 'default' : 'outline'}
                      size="sm"
                      className={
                        lead.status === s
                          ? 'bg-indigo-600 text-white text-xs'
                          : 'text-xs'
                      }
                      onClick={() => handleStatusChange(s)}
                      disabled={updateLeadStatus.isPending || updateLeadTemperature.isPending}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Temperature */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Temperature
                </p>
                <div className="flex gap-2">
                  {TEMPERATURE_OPTIONS.map((t) => (
                    <Button
                      key={t}
                      variant={lead.temperature === t ? 'default' : 'outline'}
                      size="sm"
                      className={
                        lead.temperature === t
                          ? 'bg-indigo-600 text-white'
                          : ''
                      }
                      onClick={() => handleTemperatureChange(t)}
                      disabled={updateLeadTemperature.isPending || updateLeadStatus.isPending}
                    >
                      {t === 'Hot' ? '🔥' : t === 'Warm' ? '☀️' : '❄️'} {t}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick note */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Quick Note
                </p>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                  maxLength={300}
                  rows={3}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">
                    {note.length}/300
                  </span>
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!note.trim() || createNote.isPending}
                    className="bg-indigo-600"
                  >
                    Add Note
                  </Button>
                </div>
              </div>

              {/* Open full detail */}
              {leadId && (
                <Link
                  href={`/leads/${leadId}`}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  onClick={onClose}
                >
                  Open Full Detail →
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
