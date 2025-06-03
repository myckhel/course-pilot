import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { STORAGE_KEYS } from "@/constants";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - clear auth and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      // Don't redirect here to avoid circular dependency with stores
      // Let the auth store handle the redirect
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    // Handle network errors
    if (!error.response) {
      error.message = "Network error. Please check your connection.";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
