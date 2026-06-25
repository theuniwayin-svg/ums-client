'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { z } from 'zod';
import { CreateLeadSchema, type CreateLeadDto, type LeadStatus, type LeadSource, type LeadTemperature } from '@/schemas/lead.schema';
import { CollegePicker } from '@/components/college-picker';

type FormData = Omit<CreateLeadDto, 'status' | 'temperature' | 'tags'> & {
  status: LeadStatus;
  temperature: LeadTemperature;
  tags: string[];
};
import { useCreateLead, useSuggestions } from '@/hooks/use-leads';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import { api } from '@/lib/api-client';

const STATUS_OPTIONS = ['New', 'Called', 'Interested', 'Follow Up'];
const SOURCE_OPTIONS = [
  'Meta Ads', 'Google Ads', 'Walk-In', 'Referral',
  'WhatsApp', 'Website', 'Other',
];
const TEMPERATURE_OPTIONS = ['Hot', 'Warm', 'Cold'];

interface CreateLeadModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateLeadModal({ open, onClose }: CreateLeadModalProps) {
  const [step, setStep] = useState(1);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    existingLeadId: string;
    existingLeadName: string;
  } | null>(null);
  const [courseQuery, setCourseQuery] = useState('');
  const [collegeQuery, setCollegeQuery] = useState('');

  const createLead = useCreateLead();
  const courseSuggestions = useSuggestions('course', courseQuery);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(CreateLeadSchema) as any,
    defaultValues: {
      status: 'New',
      temperature: 'Warm',
      tags: [],
    },
  });

  const source = watch('source');

  const handleClose = () => {
    reset();
    setStep(1);
    setDuplicateInfo(null);
    onClose();
  };

  const debouncedPhoneCheck = useDebouncedCallback(async (phone: string) => {
    if (phone.length < 10) return;
    try {
      const { data } = await api.leads.list({ q: phone, limit: 1 });
      const leads = data?.data?.data || data?.data || [];
      if (leads.length > 0 && leads[0].phone === phone) {
        setDuplicateInfo({
          existingLeadId: leads[0]._id,
          existingLeadName: leads[0].studentName,
        });
      } else {
        setDuplicateInfo(null);
      }
    } catch {
      setDuplicateInfo(null);
    }
  }, 500);

  const onSubmit = async (data: FormData) => {
    try {
      await createLead.mutateAsync(data);
      toast.success(`Lead created for ${data.studentName}`);
      handleClose();
    } catch (err: any) {
      const error = err.response?.data?.error;
      if (error?.code === 'DUPLICATE_PHONE') {
        setDuplicateInfo(error.details);
        toast.error('Duplicate phone number detected');
      } else {
        toast.error(error?.message || 'Failed to create lead');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <div className="flex gap-2 mt-2">
            <div
              className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`}
            />
            <div
              className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Step {step} of 2</p>
        </DialogHeader>

        {duplicateInfo && (
          <Alert variant="destructive">
            <AlertDescription>
              A lead already exists for this phone:{' '}
              <strong>{duplicateInfo.existingLeadName}</strong>.{' '}
              <a
                href={`/leads/${duplicateInfo.existingLeadId}`}
                className="underline"
                target="_blank"
              >
                View existing lead
              </a>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label>Student Name *</Label>
                  <Input
                    {...register('studentName')}
                    placeholder="John Smith"
                  />
                  {errors.studentName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.studentName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneInput
                        {...field}
                        onChange={(val) => {
                          field.onChange(val);
                          debouncedPhoneCheck(val);
                        }}
                        placeholder="9876543210"
                      />
                    )}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Parent Phone</Label>
                  <Controller
                    control={control}
                    name="parentPhone"
                    render={({ field }) => (
                      <PhoneInput
                        {...field}
                        placeholder="9876543210"
                      />
                    )}
                  />
                </div>
                <div>
                  <Label>Source *</Label>
                  <Select
                    onValueChange={(v) => {
                      setValue('source', v as any);
                      if (v !== 'Other') {
                        setValue('otherSourceDescription', '');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.source && (
                    <p className="text-xs text-red-500 mt-1">Required</p>
                  )}
                </div>

                <AnimatePresence>
                  {source === 'Other' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <Label>Describe the source *</Label>
                      <Input
                        {...register('otherSourceDescription')}
                        placeholder="Please specify..."
                        className="mt-1"
                      />
                      {errors.otherSourceDescription && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.otherSourceDescription.message}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <Label>Status</Label>
                  <Select
                    defaultValue="New"
                    onValueChange={(v) => setValue('status', v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-indigo-600"
                    onClick={() => setStep(2)}
                  >
                    Next →
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label>Email</Label>
                  <Input {...register('email')} placeholder="student@email.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input {...register('city')} placeholder="Mumbai" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input {...register('state')} placeholder="Maharashtra" />
                  </div>
                </div>
                <div>
                  <Label>Course</Label>
                  <Input
                    placeholder="MBA, Engineering..."
                    {...register('course')}
                    onChange={(e) => {
                      register('course').onChange(e);
                      setCourseQuery(e.target.value);
                    }}
                    list="course-suggestions"
                  />
                  {courseSuggestions.data && courseSuggestions.data.length > 0 && (
                    <datalist id="course-suggestions">
                      {courseSuggestions.data.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  )}
                </div>
                <div>
                  <Label>Preferred College</Label>
                  <CollegePicker
                    value={watch('preferredCollege') || ''}
                    onValueChange={(value) => setValue('preferredCollege', value)}
                    placeholder="Type or select a college..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Temperature</Label>
                  <div className="flex gap-2 mt-1">
                    {TEMPERATURE_OPTIONS.map((t) => (
                      <Button
                        key={t}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setValue('temperature', t as any)}
                      >
                        {t === 'Hot' ? '🔥' : t === 'Warm' ? '☀️' : '❄️'} {t}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="text-gray-500"
                  >
                    Skip Details
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-indigo-600"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Lead'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </DialogContent>
    </Dialog>
  );
}
