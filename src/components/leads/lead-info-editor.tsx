'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollegePicker } from '@/components/college-picker';
import { api } from '@/lib/api-client';
import { useUsers } from '@/hooks/use-admin';
import { useAuthStore } from '@/store/auth.store';
import { useUpdateLead } from '@/hooks/use-leads';
import type { Lead } from '@/schemas/lead.schema';

const SOURCE_OPTIONS = [
  'Meta Ads',
  'Google Ads',
  'Walk-In',
  'Referral',
  'WhatsApp',
  'Website',
  'Other',
];

interface LeadInfoEditorProps {
  lead: Lead;
  layout?: 'stacked' | 'compact';
  title?: string;
  description?: string;
  showAssignedTo?: boolean;
}

type LeadInfoDraft = {
  studentName: string;
  phone: string;
  parentPhone: string;
  email: string;
  city: string;
  state: string;
  course: string;
  preferredCollege: string;
  source: string;
  otherSourceDescription: string;
  assignedTo: string;
};

function getAssignedToId(assignedTo: Lead['assignedTo']) {
  if (!assignedTo) return '';
  return typeof assignedTo === 'object' ? assignedTo._id : assignedTo;
}

export function LeadInfoEditor({
  lead,
  layout = 'stacked',
  title = 'Lead Information',
  description = 'Update the core lead details here.',
  showAssignedTo = false,
}: LeadInfoEditorProps) {
  const updateLead = useUpdateLead(lead._id);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const canEditAssignee = showAssignedTo && isAdmin;
  const { data: staffUsersData } = useUsers({ limit: 100 }, canEditAssignee);
  const currentAssignee = typeof lead.assignedTo === 'object' ? lead.assignedTo : null;
  const assignedToId = getAssignedToId(lead.assignedTo);
  const [draft, setDraft] = useState<LeadInfoDraft>({
    studentName: lead.studentName || '',
    phone: lead.phone || '',
    parentPhone: lead.parentPhone || '',
    email: lead.email || '',
    city: lead.city || '',
    state: lead.state || '',
    course: lead.course || '',
    preferredCollege: lead.preferredCollege || '',
    source: lead.source || 'Meta Ads',
    otherSourceDescription: lead.otherSourceDescription || '',
    assignedTo: assignedToId,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { data: currentAssigneeData } = useQuery({
    queryKey: ['users', assignedToId],
    queryFn: async () => {
      const { data } = await api.users.get(assignedToId);
      return data?.data;
    },
    enabled: canEditAssignee && !!assignedToId && !currentAssignee,
  });

  const staffUsers = (() => {
    const maybeRows = staffUsersData?.data?.data;
    const rows = Array.isArray(maybeRows)
      ? maybeRows
      : Array.isArray(staffUsersData?.data)
        ? staffUsersData.data
        : Array.isArray(staffUsersData)
          ? staffUsersData
          : [];

    return rows.filter((staff: any) => ['admin', 'staff', 'superadmin'].includes(staff.role));
  })();
  const resolvedCurrentAssignee = currentAssignee || currentAssigneeData || null;
  const hasCurrentAssigneeOption = !currentAssignee
    ? true
    : staffUsers.some((staff: any) => staff._id === currentAssignee._id);

  useEffect(() => {
    setDraft({
      studentName: lead.studentName || '',
      phone: lead.phone || '',
      parentPhone: lead.parentPhone || '',
      email: lead.email || '',
      city: lead.city || '',
      state: lead.state || '',
      course: lead.course || '',
      preferredCollege: lead.preferredCollege || '',
      source: lead.source || 'Meta Ads',
      otherSourceDescription: lead.otherSourceDescription || '',
      assignedTo: getAssignedToId(lead.assignedTo),
    });
  }, [lead]);

  const handleFieldChange = (field: keyof LeadInfoDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    const payload: Record<string, unknown> = { version: lead.version };

    (Object.keys(draft) as (keyof LeadInfoDraft)[]).forEach((field) => {
      const nextValue = draft[field].trim();
      const previousValue = ((lead as any)[field] || '').toString();

      if (nextValue !== previousValue) {
        payload[field] = nextValue;
      }
    });

    if (draft.source !== 'Other') {
      payload.otherSourceDescription = '';
    }

    if (canEditAssignee && draft.assignedTo !== getAssignedToId(lead.assignedTo)) {
      payload.assignedTo = draft.assignedTo;
    }

    if (Object.keys(payload).length === 1) {
      return;
    }

    try {
      setIsSaving(true);
      await updateLead.mutateAsync(payload);
      toast.success('Lead information updated');
    } catch {
      toast.error('Failed to update lead information');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <div className={layout === 'compact' ? 'grid gap-3' : 'grid gap-4 md:grid-cols-2'}>
        <div className="space-y-1.5">
          <Label htmlFor={`studentName-${lead._id}`}>Student Name</Label>
          <Input
            id={`studentName-${lead._id}`}
            value={draft.studentName}
            onChange={(event) => handleFieldChange('studentName', event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`phone-${lead._id}`}>Phone</Label>
          <Input
            id={`phone-${lead._id}`}
            value={draft.phone}
            onChange={(event) => handleFieldChange('phone', event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`parentPhone-${lead._id}`}>Parent Phone</Label>
          <Input
            id={`parentPhone-${lead._id}`}
            value={draft.parentPhone}
            onChange={(event) => handleFieldChange('parentPhone', event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`email-${lead._id}`}>Email</Label>
          <Input
            id={`email-${lead._id}`}
            value={draft.email}
            onChange={(event) => handleFieldChange('email', event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`city-${lead._id}`}>City</Label>
          <Input
            id={`city-${lead._id}`}
            value={draft.city}
            onChange={(event) => handleFieldChange('city', event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`state-${lead._id}`}>State</Label>
          <Input
            id={`state-${lead._id}`}
            value={draft.state}
            onChange={(event) => handleFieldChange('state', event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`course-${lead._id}`}>Course</Label>
          <Input
            id={`course-${lead._id}`}
            value={draft.course}
            onChange={(event) => handleFieldChange('course', event.target.value)}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor={`preferredCollege-${lead._id}`}>Preferred College</Label>
          <CollegePicker
            value={draft.preferredCollege}
            onValueChange={(value) => handleFieldChange('preferredCollege', value)}
            placeholder="Type or select a college..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`source-${lead._id}`}>Source</Label>
          <Select
            value={draft.source}
            onValueChange={(value) => handleFieldChange('source', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {draft.source === 'Other' && (
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor={`otherSourceDescription-${lead._id}`}>Other Source Description</Label>
            <Textarea
              id={`otherSourceDescription-${lead._id}`}
              value={draft.otherSourceDescription}
              onChange={(event) => handleFieldChange('otherSourceDescription', event.target.value)}
              rows={2}
            />
          </div>
        )}

        {canEditAssignee && (
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs uppercase tracking-wide text-gray-500">
              Assigned To
            </Label>
            <Select
              value={draft.assignedTo || 'unassigned'}
              onValueChange={(value) => handleFieldChange('assignedTo', value === 'unassigned' ? '' : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {resolvedCurrentAssignee && !hasCurrentAssigneeOption && (
                  <SelectItem value={resolvedCurrentAssignee._id}>
                    {resolvedCurrentAssignee.name} · {resolvedCurrentAssignee.role || 'User'}
                  </SelectItem>
                )}
                {staffUsers.map((staff: any) => (
                  <SelectItem key={staff._id} value={staff._id}>
                    {staff.name} · {staff.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          onClick={handleSave}
          disabled={isSaving || updateLead.isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}