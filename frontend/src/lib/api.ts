import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh');
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        localStorage.removeItem('accessToken');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
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

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

// Tenant API
export const tenantApi = {
  list: () => api.get('/tenants'),
  create: (data: { name: string; slug: string; businessType?: string }) =>
    api.post('/tenants', data),
  get: (id: string) => api.get(`/tenants/${id}`),
};

// CS API (OmniDesk)
export const csApi = {
  getConversations: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/omnidesk/tenants/${tenantId}/conversations`, { params }),
  getConversation: (tenantId: string, id: string) =>
    api.get(`/omnidesk/tenants/${tenantId}/conversations/${id}`),
  sendMessage: (tenantId: string, id: string, content: string) =>
    api.post(`/omnidesk/tenants/${tenantId}/conversations/${id}/messages`, { content }),
  getDocuments: (tenantId: string) =>
    api.get(`/omnidesk/tenants/${tenantId}/knowledge/documents`),
  uploadDocument: (tenantId: string, formData: FormData) =>
    api.post(`/omnidesk/tenants/${tenantId}/knowledge/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }),
  deleteDocument: (tenantId: string, id: string) =>
    api.delete(`/omnidesk/tenants/${tenantId}/knowledge/documents/${id}`),
  searchKnowledge: (tenantId: string, query: string, topK?: number) =>
    api.post(`/omnidesk/tenants/${tenantId}/knowledge/search`, { query, topK }),
  getPatterns: (tenantId: string) =>
    api.get(`/omnidesk/tenants/${tenantId}/brain/patterns`),
  getBrainInsights: (tenantId: string) =>
    api.get(`/omnidesk/tenants/${tenantId}/brain/insights`),
};

// Credit API
export const creditApi = {
  getBalance: (tenantId: string) =>
    api.get(`/omnidesk/tenants/${tenantId}/credits`),
  getTransactions: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/omnidesk/tenants/${tenantId}/credits/transactions`, { params }),
  charge: (tenantId: string, amount: number) =>
    api.post(`/omnidesk/tenants/${tenantId}/credits/charge`, { amount }),
  verifyCharge: (tenantId: string, impUid: string, merchantUid: string) =>
    api.post(`/omnidesk/tenants/${tenantId}/credits/charge/verify`, { impUid, merchantUid }),
};

// Widget API
export const widgetApi = {
  getAll: (tenantId: string) =>
    api.get(`/omnidesk/tenants/${tenantId}/widgets`),
  create: (tenantId: string, data: Record<string, unknown>) =>
    api.post(`/omnidesk/tenants/${tenantId}/widgets`, data),
  update: (tenantId: string, id: string, data: Record<string, unknown>) =>
    api.patch(`/omnidesk/tenants/${tenantId}/widgets/${id}`, data),
  delete: (tenantId: string, id: string) =>
    api.delete(`/omnidesk/tenants/${tenantId}/widgets/${id}`),
};

// Channel API
export const channelApi = {
  getAll: (tenantId: string) =>
    api.get(`/omnidesk/tenants/${tenantId}/channels`),
  create: (tenantId: string, data: Record<string, unknown>) =>
    api.post(`/omnidesk/tenants/${tenantId}/channels`, data),
  update: (tenantId: string, id: string, data: Record<string, unknown>) =>
    api.patch(`/omnidesk/tenants/${tenantId}/channels/${id}`, data),
  delete: (tenantId: string, id: string) =>
    api.delete(`/omnidesk/tenants/${tenantId}/channels/${id}`),
};

// Business Profile API
export const businessProfileApi = {
  get: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/business-profile`),
  upsert: (tenantId: string, data: Record<string, unknown>) =>
    api.put(`/tenants/${tenantId}/business-profile`, data),
};

// Reservation API
export const reservationApi = {
  // Services
  createService: (tenantId: string, data: Record<string, unknown>) =>
    api.post(`/tenants/${tenantId}/services`, data),
  getServices: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/services`),
  updateService: (tenantId: string, id: string, data: Record<string, unknown>) =>
    api.patch(`/tenants/${tenantId}/services/${id}`, data),
  deleteService: (tenantId: string, id: string) =>
    api.delete(`/tenants/${tenantId}/services/${id}`),

  // Slots
  getSlots: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/reservation-slots`),
  upsertSlots: (tenantId: string, data: Record<string, unknown>[]) =>
    api.put(`/tenants/${tenantId}/reservation-slots`, { slots: data }),

  // Reservations
  create: (tenantId: string, data: Record<string, unknown>) =>
    api.post(`/tenants/${tenantId}/reservations`, data),
  list: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/tenants/${tenantId}/reservations`, { params }),
  get: (tenantId: string, id: string) =>
    api.get(`/tenants/${tenantId}/reservations/${id}`),
  update: (tenantId: string, id: string, data: Record<string, unknown>) =>
    api.patch(`/tenants/${tenantId}/reservations/${id}`, data),
  updateStatus: (tenantId: string, id: string, status: string) =>
    api.patch(`/tenants/${tenantId}/reservations/${id}/status`, { status }),
  getAvailable: (tenantId: string, params: { date: string }) =>
    api.get(`/tenants/${tenantId}/reservations/available`, { params }),
};

// CRM API
export const crmApi = {
  create: (tenantId: string, data: Record<string, unknown>) =>
    api.post(`/tenants/${tenantId}/customers`, data),
  list: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/tenants/${tenantId}/customers`, { params }),
  get: (tenantId: string, id: string) =>
    api.get(`/tenants/${tenantId}/customers/${id}`),
  update: (tenantId: string, id: string, data: Record<string, unknown>) =>
    api.patch(`/tenants/${tenantId}/customers/${id}`, data),
  remove: (tenantId: string, id: string) =>
    api.delete(`/tenants/${tenantId}/customers/${id}`),
  getHistory: (tenantId: string, id: string) =>
    api.get(`/tenants/${tenantId}/customers/${id}/history`),
  createContactLog: (tenantId: string, customerId: string, data: Record<string, unknown>) =>
    api.post(`/tenants/${tenantId}/customers/${customerId}/contact-logs`, data),
  getContactLogs: (tenantId: string, customerId: string) =>
    api.get(`/tenants/${tenantId}/customers/${customerId}/contact-logs`),
};

// Invoice API
export const invoiceApi = {
  create: (tenantId: string, data: Record<string, unknown>) =>
    api.post(`/tenants/${tenantId}/invoices`, data),
  list: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/tenants/${tenantId}/invoices`, { params }),
  get: (tenantId: string, id: string) =>
    api.get(`/tenants/${tenantId}/invoices/${id}`),
  update: (tenantId: string, id: string, data: Record<string, unknown>) =>
    api.patch(`/tenants/${tenantId}/invoices/${id}`, data),
  remove: (tenantId: string, id: string) =>
    api.delete(`/tenants/${tenantId}/invoices/${id}`),
  updateStatus: (tenantId: string, id: string, status: string) =>
    api.patch(`/tenants/${tenantId}/invoices/${id}/status`, { status }),
};

// Report API
export const reportApi = {
  createTransaction: (tenantId: string, data: Record<string, unknown>) =>
    api.post(`/tenants/${tenantId}/transactions`, data),
  getTransactions: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/tenants/${tenantId}/transactions`, { params }),
  removeTransaction: (tenantId: string, id: string) =>
    api.delete(`/tenants/${tenantId}/transactions/${id}`),
  getSummary: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/tenants/${tenantId}/reports/summary`, { params }),
  getByCategory: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/tenants/${tenantId}/reports/category`, { params }),
  getTrend: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/tenants/${tenantId}/reports/trend`, { params }),
  getDashboard: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/reports/dashboard`),
};

// HR API
export const hrApi = {
  createEmployee: (tenantId: string, data: Record<string, unknown>) =>
    api.post(`/tenants/${tenantId}/employees`, data),
  getEmployees: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/employees`),
  getEmployee: (tenantId: string, id: string) =>
    api.get(`/tenants/${tenantId}/employees/${id}`),
  updateEmployee: (tenantId: string, id: string, data: Record<string, unknown>) =>
    api.patch(`/tenants/${tenantId}/employees/${id}`, data),
  deactivateEmployee: (tenantId: string, id: string) =>
    api.delete(`/tenants/${tenantId}/employees/${id}`),
  clockIn: (tenantId: string, employeeId: string) =>
    api.post(`/tenants/${tenantId}/employees/${employeeId}/clock-in`),
  clockOut: (tenantId: string, employeeId: string) =>
    api.post(`/tenants/${tenantId}/employees/${employeeId}/clock-out`),
  getAttendance: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/tenants/${tenantId}/attendance`, { params }),
  getAttendanceSummary: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/tenants/${tenantId}/attendance/summary`, { params }),
  createLeave: (tenantId: string, data: Record<string, unknown>) =>
    api.post(`/tenants/${tenantId}/leaves`, data),
  getLeaves: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/tenants/${tenantId}/leaves`, { params }),
  approveLeave: (tenantId: string, id: string, data: { status: string }) =>
    api.patch(`/tenants/${tenantId}/leaves/${id}/approve`, data),
};

export default api;
