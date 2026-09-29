import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (err: any) => void }> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    // Automatically unpack your standard API response structure
    const data = response.data;
    if (data && typeof data === "object" && "success" in data && data.data !== undefined) {
      return data.data;
    }
    return data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Format the error nicely before throwing
    const formattedError = new Error(
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      "Something went wrong."
    );
    (formattedError as any).status = error.response?.status;
    (formattedError as any).code = error.response?.data?.error?.code || "UNKNOWN_ERROR";

    // Handle 401 Unauthorized for token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return axiosInstance(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${API_BASE}/api/auth/refresh`, {}, { withCredentials: true });
        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err as Error);
        return Promise.reject(formattedError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(formattedError);
  }
);

export const apiClient = {
  get: <T>(path: string) => axiosInstance.get<any, T>(path),
  post: <T>(path: string, body?: unknown) => axiosInstance.post<any, T>(path, body),
  patch: <T>(path: string, body?: unknown) => axiosInstance.patch<any, T>(path, body),
  put: <T>(path: string, body?: unknown) => axiosInstance.put<any, T>(path, body),
  delete: <T>(path: string) => axiosInstance.delete<any, T>(path),
};
