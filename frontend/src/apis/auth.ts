import apiClient from "./client";
import { API_ENDPOINTS } from "@/constants";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from "@/types";

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.LOGIN,
      data
    );
    return response.data!;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.REGISTER,
      data
    );
    return response.data!;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>(API_ENDPOINTS.ME);
    return response.data!;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.REFRESH);
    return response.data!;
  },
};
