'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(),
    queryFn: async () => {
      const { data } = await api.analytics.dashboard();
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes — matches cache-control
  });
}

export function useStaffPerformance() {
  return useQuery({
    queryKey: queryKeys.analytics.staffPerformance(),
    queryFn: async () => {
      const { data } = await api.analytics.staffPerformance();
      return data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAnalyticsTrends(period = '30d') {
  return useQuery({
    queryKey: queryKeys.analytics.trends(period),
    queryFn: async () => {
      const { data } = await api.analytics.trends(period);
      return data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUsers(params?: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: async () => {
      const { data } = await api.users.list(params);
      return data;
    },
    enabled,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useDisableUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.users.disable(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useEnableUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.users.enable(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useAuditLogs(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: async () => {
      const { data } = await api.audit.list(params);
      return data;
    },
  });
}
