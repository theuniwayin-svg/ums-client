import type { LeadFilters } from '@/store/leads-ui.store';

export const queryKeys = {
  leads: {
    all: ['leads'] as const,
    list: (filters: LeadFilters) => ['leads', 'list', filters] as const,
    detail: (id: string) => ['leads', 'detail', id] as const,
    activities: (id: string, cursor?: string) =>
      ['leads', id, 'activities', cursor] as const,
    notes: (id: string) => ['leads', id, 'notes'] as const,
    followUps: (id: string) => ['leads', id, 'follow-ups'] as const,
    suggestions: (field: string, q: string) =>
      ['leads', 'suggestions', field, q] as const,
  },
  analytics: {
    dashboard: () => ['analytics', 'dashboard'] as const,
    staffPerformance: () => ['analytics', 'staff-performance'] as const,
    trends: (period: string) => ['analytics', 'trends', period] as const,
  },
  followUps: {
    pending: () => ['follow-ups', 'pending'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params?: Record<string, unknown>) =>
      ['users', 'list', params] as const,
    detail: (id: string) => ['users', id] as const,
    me: () => ['users', 'me'] as const,
  },
  audit: {
    list: (params?: Record<string, unknown>) => ['audit', 'list', params] as const,
  },
};
