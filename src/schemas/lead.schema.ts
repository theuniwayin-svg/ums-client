// KEEP IN SYNC WITH API (src/modules/leads/schemas/lead.schema.ts)
import { z } from 'zod';

export const LeadStatusEnum = z.enum([
  'New',
  'Called',
  'Interested',
  'Follow Up',
  'Admission Confirmed',
  'Not Interested',
  'Closed',
]);

export const LeadTemperatureEnum = z.enum(['Hot', 'Warm', 'Cold']);

export const LeadSourceEnum = z.enum([
  'Meta Ads',
  'Google Ads',
  'Walk-In',
  'Referral',
  'WhatsApp',
  'Website',
  'Other',
]);

export const CreateLeadSchema = z
  .object({
    studentName: z.string().min(2).max(100),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
    parentPhone: z
      .string()
      .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number')
      .optional()
      .or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    course: z.string().max(200).optional(),
    preferredCollege: z.string().max(200).optional(),
    source: LeadSourceEnum,
    otherSourceDescription: z.string().max(100).optional(),
    status: LeadStatusEnum.default('New'),
    temperature: LeadTemperatureEnum.default('Warm'),
    tags: z.array(z.string()).max(10).default([]),
  })
  .refine(
    (data) =>
      data.source !== 'Other' ||
      (data.otherSourceDescription && data.otherSourceDescription.trim().length > 0),
    {
      message: 'Please describe the lead source when "Other" is selected',
      path: ['otherSourceDescription'],
    },
  );

export type CreateLeadDto = z.infer<typeof CreateLeadSchema>;
export type LeadStatus = z.infer<typeof LeadStatusEnum>;
export type LeadTemperature = z.infer<typeof LeadTemperatureEnum>;
export type LeadSource = z.infer<typeof LeadSourceEnum>;

export interface Lead {
  _id: string;
  studentName: string;
  phone: string;
  parentPhone?: string;
  email?: string;
  city?: string;
  state?: string;
  course?: string;
  preferredCollege?: string;
  source: string;
  otherSourceDescription?: string;
  status: string;
  temperature: string;
  tags: string[];
  assignedTo?: { _id: string; name: string; email: string; role?: string } | string;
  followUp?: {
    scheduledFor?: string;
    type?: string;
    note?: string;
    isCompleted: boolean;
    completedAt?: string;
  };
  version: number;
  isDeleted: boolean;
  createdBy: { _id: string; name: string; email: string } | string;
  updatedBy?: { _id: string; name: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
}
