'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollegePicker } from '@/components/college-picker';
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
};

export function LeadInfoEditor({
  lead,
  layout = 'stacked',
  title = 'Lead Information',
  description = 'Update the core lead details here.',
}: LeadInfoEditorProps) {
  const updateLead = useUpdateLead(lead._id);
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
  });
  const [isSaving, setIsSaving] = useState(false);

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