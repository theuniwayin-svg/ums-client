'use client';

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { LeadFilters } from '@/store/leads-ui.store';
import type { Lead } from '@/schemas/lead.schema';

export function useLeads(filters: LeadFilters = {}) {
  return useQuery({
    queryKey: queryKeys.leads.list(filters),
    queryFn: async () => {
      const { data } = await api.leads.list(
        filters as Record<string, unknown>,
      );
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id),
    queryFn: async () => {
      const { data } = await api.leads.get(id);
      return data.data as Lead;
    },
    enabled: !!id,
  });
}

export function useLeadActivities(leadId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.leads.activities(leadId),
    queryFn: async ({ pageParam }) => {
      const { data } = await api.activities.list(leadId, {
        cursor: pageParam,
        limit: 20,
      });
      return data.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => lastPage?.meta?.nextCursor,
  });
}

export function useLeadNotes(leadId: string) {
  return useQuery({
    queryKey: queryKeys.leads.notes(leadId),
    queryFn: async () => {
      const { data } = await api.notes.list(leadId);
      return data.data;
    },
    enabled: !!leadId,
  });
}

export function useLeadFollowUps(leadId: string) {
  return useQuery({
    queryKey: queryKeys.leads.followUps(leadId),
    queryFn: async () => {
      const { data } = await api.followUps.byLead(leadId);
      return data.data;
    },
    enabled: !!leadId,
  });
}

export function useSuggestions(field: string, q: string, minLength = 2) {
  return useQuery({
    queryKey: queryKeys.leads.suggestions(field, q),
    queryFn: async () => {
      const { data } = await api.leads.suggestions(field, q);
      return data.data?.suggestions as string[];
    },
    enabled: q.length >= minLength,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.leads.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export function useUpdateLead(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.leads.update(leadId, data),
    onMutate: async (newData: any) => {
      const queryKey = queryKeys.leads.detail(leadId);
      await queryClient.cancelQueries({ queryKey });
      const previousLead = queryClient.getQueryData<Lead>(queryKey);
      if (previousLead) {
        queryClient.setQueryData<Lead>(queryKey, {
          ...previousLead,
          ...newData,
        });
      }
      return { previousLead };
    },
    onError: (err, newData, context) => {
      if (context?.previousLead) {
        queryClient.setQueryData(queryKeys.leads.detail(leadId), context.previousLead);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) });
      queryClient.invalidateQueries({ queryKey: ['leads', leadId, 'activities'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export function useUpdateLeadStatus(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { version: number; status: string }) =>
      api.leads.updateStatus(leadId, data),
    onMutate: async (newData) => {
      const queryKey = queryKeys.leads.detail(leadId);
      await queryClient.cancelQueries({ queryKey });
      const previousLead = queryClient.getQueryData<Lead>(queryKey);
      if (previousLead) {
        queryClient.setQueryData<Lead>(queryKey, {
          ...previousLead,
          status: newData.status,
        });
      }
      return { previousLead };
    },
    onError: (err, newData, context) => {
      if (context?.previousLead) {
        queryClient.setQueryData(queryKeys.leads.detail(leadId), context.previousLead);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) });
      queryClient.invalidateQueries({ queryKey: ['leads', leadId, 'activities'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export function useUpdateLeadTemperature(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { version: number; temperature: string }) =>
      api.leads.updateTemperature(leadId, data),
    onMutate: async (newData) => {
      const queryKey = queryKeys.leads.detail(leadId);
      await queryClient.cancelQueries({ queryKey });
      const previousLead = queryClient.getQueryData<Lead>(queryKey);
      if (previousLead) {
        queryClient.setQueryData<Lead>(queryKey, {
          ...previousLead,
          temperature: newData.temperature,
        });
      }
      return { previousLead };
    },
    onError: (err, newData, context) => {
      if (context?.previousLead) {
        queryClient.setQueryData(queryKeys.leads.detail(leadId), context.previousLead);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) });
      queryClient.invalidateQueries({ queryKey: ['leads', leadId, 'activities'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export function useCloseLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => api.leads.close(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export function useBulkUpdateLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      leadIds: string[];
      action: string;
      value: string;
    }) => api.leads.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export function useBulkAssignLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { leadIds: string[]; assignedTo: string }) =>
      api.leads.bulkAssign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.audit.list() });
    },
  });
}

export function useCreateNote(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.notes.create(leadId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads.notes(leadId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads.activities(leadId),
      });
    },
  });
}

export function useCreateFollowUp(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.followUps.create(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads.followUps(leadId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads.detail(leadId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.followUps.pending(),
      });
    },
  });
}

export function useCompleteFollowUp(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followUpId: string) =>
      api.followUps.complete(leadId, followUpId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads.followUps(leadId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.followUps.pending(),
      });
    },
  });
}

export function usePendingFollowUps() {
  return useQuery({
    queryKey: queryKeys.followUps.pending(),
    queryFn: async () => {
      const { data } = await api.followUps.pending();
      return data.data;
    },
  });
}
