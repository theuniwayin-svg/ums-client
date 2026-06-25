import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true, // send HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token from memory store
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: handle 401 → refresh flow
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newAccessToken = data.data?.accessToken || data.accessToken;
        useAuthStore.getState().setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email, password }),
    refresh: () => apiClient.post('/auth/refresh'),
    logout: () => apiClient.post('/auth/logout'),
    me: () => apiClient.get('/auth/me'),
  },

  // Leads
  leads: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/leads', { params }),
    get: (id: string) => apiClient.get(`/leads/${id}`),
    create: (data: unknown) => apiClient.post('/leads', data),
    update: (id: string, data: unknown) =>
      apiClient.patch(`/leads/${id}`, data),
    updateStatus: (id: string, data: unknown) =>
      apiClient.patch(`/leads/${id}/status`, data),
    updateTemperature: (id: string, data: unknown) =>
      apiClient.patch(`/leads/${id}/temperature`, data),
    close: (id: string) => apiClient.patch(`/leads/${id}/close`),
    delete: (id: string) => apiClient.delete(`/leads/${id}`),
    bulkUpdate: (data: unknown) => apiClient.patch('/leads/bulk', data),
    bulkAssign: (data: unknown) => apiClient.patch('/leads/bulk/assign', data),
    suggestions: (field: string, q: string) =>
      apiClient.get('/leads/suggestions', { params: { field, q } }),
    export: (params?: Record<string, unknown>) =>
      apiClient.get('/leads/export', {
        params,
        responseType: 'blob',
      }),
  },

  // Activities
  activities: {
    list: (leadId: string, params?: Record<string, unknown>) =>
      apiClient.get(`/leads/${leadId}/activities`, { params }),
  },

  // Notes
  notes: {
    list: (leadId: string) => apiClient.get(`/leads/${leadId}/notes`),
    create: (leadId: string, content: string) =>
      apiClient.post(`/leads/${leadId}/notes`, { content }),
    update: (leadId: string, noteId: string, content: string) =>
      apiClient.patch(`/leads/${leadId}/notes/${noteId}`, { content }),
    delete: (leadId: string, noteId: string) =>
      apiClient.delete(`/leads/${leadId}/notes/${noteId}`),
  },

  // Follow-ups
  followUps: {
    pending: () => apiClient.get('/follow-ups/pending'),
    byLead: (leadId: string) => apiClient.get(`/leads/${leadId}/follow-ups`),
    create: (leadId: string, data: unknown) =>
      apiClient.post(`/leads/${leadId}/follow-ups`, data),
    complete: (leadId: string, followUpId: string) =>
      apiClient.patch(
        `/leads/${leadId}/follow-ups/${followUpId}/complete`,
      ),
  },

  // Analytics
  analytics: {
    dashboard: () => apiClient.get('/analytics/dashboard'),
    staffPerformance: () => apiClient.get('/analytics/staff-performance'),
    trends: (period = '30d') =>
      apiClient.get('/analytics/trends', { params: { period } }),
  },

  // Users
  users: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/users', { params }),
    get: (id: string) => apiClient.get(`/users/${id}`),
    me: () => apiClient.get('/users/me'),
    create: (data: unknown) => apiClient.post('/users', data),
    update: (id: string, data: unknown) =>
      apiClient.patch(`/users/${id}`, data),
    disable: (id: string) => apiClient.patch(`/users/${id}/disable`),
    enable: (id: string) => apiClient.patch(`/users/${id}/enable`),
  },

  // Audit
  audit: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/audit', { params }),
  },
};
