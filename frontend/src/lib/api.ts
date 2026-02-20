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
  register: async (data: { email: string; password: string; name?: string }) => {
    return { data: { success: true } };
  },
  login: async (data: { email: string; password: string }) => {
    return {
      data: {
        accessToken: 'demo-token',
        user: { id: 'demoId', email: data.email, name: 'DemoAdmin', role: 'ADMIN' }
      }
    };
  },
  refresh: async () => { return { data: { accessToken: 'demo-token' } }; },
  logout: async () => { return { data: { success: true } }; },
  getProfile: async () => {
    return { data: { id: 'demoId', email: 'demo@bizpilot.kr', name: 'DemoAdmin', role: 'ADMIN' } };
  },
};

// Tenant API
export const tenantApi = {
  list: async () => {
    return { data: [{ id: 'demo-tenant-id', name: '블룸 헤어살롱', slug: 'bloom', businessType: 'SALON' }] };
  },
  create: (data: { name: string; slug: string; businessType?: string }) =>
    api.post('/omnidesk/tenants', data),
  get: (id: string) => api.get(`/omnidesk/tenants/${id}`),
};

// CS API (OmniDesk)
export const csApi = {
  getConversations: async (tenantId: string, params?: Record<string, unknown>) => {
    return {
      data: {
        items: [],
        total: 0,
      }
    };
  },
  getConversation: (tenantId: string, id: string) =>
    api.get(`/omnidesk/tenants/${tenantId}/conversations/${id}`),
  sendMessage: (tenantId: string, id: string, content: string) =>
    api.post(`/omnidesk/tenants/${tenantId}/conversations/${id}/messages`, { content }),
  getDocuments: async (tenantId: string) => {
    return {
      data: [
        {
          id: 'doc-1',
          title: '블룸 헤어살롱 영업 매뉴얼',
          fileName: '블룸_헤어살롱_영업_매뉴얼.pdf',
          fileType: 'pdf',
          fileSize: 1024500,
          status: 'READY',
          chunkCount: 15,
          createdAt: new Date().toISOString()
        },
        {
          id: 'doc-2',
          title: '2026 기본 시술 가격표',
          fileName: '2026_시술_가격표.pdf',
          fileType: 'pdf',
          fileSize: 450000,
          status: 'READY',
          chunkCount: 5,
          createdAt: new Date().toISOString()
        },
        {
          id: 'doc-3',
          title: '고객 응대 가이드라인',
          fileName: 'customer_service_guide.md',
          fileType: 'md',
          fileSize: 12000,
          status: 'READY',
          chunkCount: 8,
          createdAt: new Date().toISOString()
        }
      ]
    };
  },
  uploadDocument: (tenantId: string, formData: FormData) =>
    api.post(`/omnidesk/tenants/${tenantId}/knowledge/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }),
  deleteDocument: (tenantId: string, id: string) =>
    api.delete(`/omnidesk/tenants/${tenantId}/knowledge/documents/${id}`),
  searchKnowledge: (tenantId: string, query: string, topK?: number) =>
    api.post(`/omnidesk/tenants/${tenantId}/knowledge/search`, { query, topK }),
  getPatterns: async (tenantId: string) => {
    return {
      data: {
        items: [
          {
            id: 'pat-1',
            type: 'SUCCESS_PATTERN',
            context: '영업시간, 예약 문의 기본',
            content: '블룸 헤어살롱 영업시간 안내입니다 🕐\n\n📍 평일: 오전 10:00 ~ 오후 8:00\n📍 토요일: 오전 10:00 ~ 오후 7:00\n📍 일요일: 오전 11:00 ~ 오후 6:00\n📍 정기 휴무: 매주 월요일\n\n마지막 접수는 마감 1시간 전까지 가능합니다!',
            confidence: 0.95,
            hitCount: 142,
            createdAt: new Date().toISOString()
          },
          {
            id: 'pat-2',
            type: 'SUCCESS_PATTERN',
            context: '주차장 위치 안내',
            content: '블룸 헤어살롱 오시는 길 안내입니다 📍\n\n주소: 서울시 강남구 역삼동 123-45 블룸빌딩 2층\n🚇 지하철: 역삼역 3번 출구에서 도보 3분\n🚗 주차: 건물 지하주차장 이용 가능 (2시간 무료)',
            confidence: 0.92,
            hitCount: 89,
            createdAt: new Date().toISOString()
          },
          {
            id: 'pat-3',
            type: 'SUCCESS_PATTERN',
            context: '펌 시술 및 가격',
            content: '펌 시술 안내드립니다 💇‍♀️\n\n디지털 펌: 80,000원~\n셋팅 펌: 90,000원~\n볼륨 매직: 100,000원~\n다운 펌 (남성): 40,000원~\n\n모발 길이와 상태에 따라 가격이 달라질 수 있어요. 시술 시간은 약 2~3시간 소요됩니다.',
            confidence: 0.88,
            hitCount: 205,
            createdAt: new Date().toISOString()
          },
          {
            id: 'pat-4',
            type: 'SUCCESS_PATTERN',
            context: '예약 취소 및 노쇼 규정',
            content: '예약 변경 및 취소 안내드립니다! 😊\n당일 취소 및 노쇼(No-show)는 다음 예약에 불이익이 있을 수 있습니다.\n예약 변경은 최소 1일 전까지 네이버 예약이나 매장으로 연락 부탁드립니다.',
            confidence: 0.85,
            hitCount: 56,
            createdAt: new Date().toISOString()
          }
        ],
        total: 4
      }
    };
  },
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
