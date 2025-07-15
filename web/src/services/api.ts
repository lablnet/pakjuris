import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { useUserStore } from '../stores/userStore';
import { MeType } from '../types/api';

const baseURL = import.meta.env.VITE_API_SERVER || "https://backend.pakjuris.pk/api/";

// Set Axios defaults
axios.defaults.baseURL = baseURL;
axios.defaults.withCredentials = true;
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Create an Axios instance
const axiosInstance: AxiosInstance = axios.create();

// Interface to extend AxiosRequestConfig with a _retry property
interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
  _retry?: boolean;
}

// Interface for items in the failed request queue
interface FailedQueueItem {
  resolve: (value: string | null | PromiseLike<string | null>) => void;
  reject: (error: any) => void;
}

// Variables to manage token refreshing
let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

// Function to process the failed request queue
const processQueue = (error: any, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle 401 errors and token refreshing
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfigWithRetry;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axiosInstance.post<{ access_token: string }>('/auth/refresh-token/');
        const { access_token } = response.data;

        processQueue(null, access_token);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useUserStore.getState().setUser(null);
        //window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Generic Axios wrapper to extract data from responses
const axiosWrapper = <T>(apiCall: Promise<AxiosResponse<T>>): Promise<T> => {
  return apiCall.then((response) => response.data).catch((err) => Promise.reject(err));
};


// API object with typed methods
const api = {
  auth: {
    login: (credentials: any): Promise<MeType> =>
      axiosWrapper(axiosInstance.post('/auth/login/', credentials)),

    logout: (): Promise<{ message: string }> =>
      axiosWrapper(axiosInstance.post('/auth/logout/')),

    update: (data: Partial<any>): Promise<any> =>
      axiosWrapper(axiosInstance.put('/user/me/', data)),

    refreshToken: (): Promise<{ access_token: string }> =>
      axiosWrapper(axiosInstance.post('/user/refresh-token/')),

    // Password reset routes for the auth API
    reset: {
      sendOTP: (email: string): Promise<{ message: string }> =>
        axiosWrapper(axiosInstance.post('/auth/reset/send-otp', { email })),
      validateOTP: (data: { email: string; otp: string }): Promise<{ valid: boolean }> =>
        axiosWrapper(axiosInstance.post('/auth/reset/validate-otp', data)),
      updatePassword: (data: { email: string; otp: string; password: string, repeat: string }): Promise<{ message: string }> =>
        axiosWrapper(axiosInstance.post('/auth/reset/update-password', data)),
    },
    register: {
      signup: (data: { full_name: string; email: string; password: string }): Promise<any> => 
        axiosWrapper(axiosInstance.post('/auth/signup/', data)),
      validateOTP: (data: { otp: string; email: string }): Promise<MeType> => 
        axiosWrapper(axiosInstance.post('/auth/verify-email/', data)),
      resendOTP: (data: { email: string }): Promise<any> => 
        axiosWrapper(axiosInstance.post('/auth/resend-otp/', data))
    }
  },
  profile: {
    me: (): Promise<MeType> =>
      axiosWrapper(axiosInstance.get('/user/me')),
    updatePassword: (data: { current_password: string; new_password: string }): Promise<{ message: string }> =>
      axiosWrapper(axiosInstance.patch('/user/me/password/', data)),
  },
  chat: {
    conversations: {
      list: (): Promise<any> =>
        axiosWrapper(axiosInstance.get('/chat/conversations/')),
      get: (id: string): Promise<any> =>
        axiosWrapper(axiosInstance.get(`/chat/conversations/${id}`)),
      create: (data: any): Promise<any> =>
        axiosWrapper(axiosInstance.post('/chat/conversations/', data)),
      update: (id: string, data: any): Promise<any> =>
        axiosWrapper(axiosInstance.put(`/chat/conversations/${id}`, data)),
      delete: (id: string): Promise<any> =>
        axiosWrapper(axiosInstance.delete(`/chat/conversations/${id}`)),
      archive: (id: string, archived: boolean): Promise<any> =>
        axiosWrapper(axiosInstance.patch(`/chat/conversations/${id}/archive`, { archived })),
      share: (id: string): Promise<any> =>
        axiosWrapper(axiosInstance.post(`/chat/conversations/${id}/share`)),
      listArchived: (): Promise<any> =>
        axiosWrapper(axiosInstance.get('/chat/conversations/archived')),
    },
    query: (data: any): Promise<any> =>
      axiosWrapper(axiosInstance.post('/chat/query/', data)),
    feedback: {
      create: (data: { messageId: string, status: 'liked' | 'disliked', reason?: string }): Promise<any> =>
        axiosWrapper(axiosInstance.post('/chat/feedback/', data)),
      get: (messageId: string): Promise<any> =>
        axiosWrapper(axiosInstance.get(`/chat/feedback/${messageId}`)),
    }
  }
};
export { api, axiosInstance, baseURL };
export default api;
