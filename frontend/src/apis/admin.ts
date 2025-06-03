import apiClient from "./client";
import { API_ENDPOINTS } from "@/constants";
import type { AdminDashboardStats } from "@/types";

export const adminApi = {
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const response = await apiClient.get<AdminDashboardStats>(
      API_ENDPOINTS.ADMIN_DASHBOARD
    );
    return response.data!;
  },
};
