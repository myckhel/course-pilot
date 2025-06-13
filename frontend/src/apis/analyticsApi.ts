import type {
  AnalyticsData,
  TopicAnalytics,
  UserAnalytics,
  NPSData,
  ApiResponse,
} from "@/types";
import apiClient from "./client";

export const analyticsApi = {
  // Get overview analytics
  getOverviewAnalytics: (
    timeRange: string
  ): Promise<ApiResponse<AnalyticsData>> =>
    apiClient.get("/admin/analytics/overview", {
      params: { timeRange },
    }),

  // Get topic analytics
  getTopicAnalytics: (
    timeRange: string
  ): Promise<ApiResponse<TopicAnalytics[]>> =>
    apiClient.get("/admin/analytics/topics", {
      params: { timeRange },
    }),

  // Get user analytics
  getUserAnalytics: (
    timeRange: string
  ): Promise<ApiResponse<UserAnalytics[]>> =>
    apiClient.get("/admin/analytics/users", {
      params: { timeRange },
    }),

  // Export analytics report
  exportReport: (timeRange: string): Promise<ApiResponse<Blob>> =>
    apiClient.get("/admin/analytics/export", {
      params: { timeRange },
      responseType: "blob",
    }),

  // Get system metrics
  getSystemMetrics: (): Promise<
    ApiResponse<{
      cpu_usage: number;
      memory_usage: number;
      disk_usage: number;
      active_connections: number;
      response_time: number;
    }>
  > => apiClient.get("/admin/analytics/system"),

  // Get usage trends
  getUsageTrends: (
    timeRange: string
  ): Promise<
    ApiResponse<
      Array<{
        date: string;
        messages: number;
        users: number;
        sessions: number;
      }>
    >
  > =>
    apiClient.get("/admin/analytics/trends", {
      params: { timeRange },
    }),

  // Get NPS analytics (admin)
  getNPSAnalytics: (params?: {
    topic_id?: string;
    days?: number;
  }): Promise<ApiResponse<NPSData>> =>
    apiClient.get("/admin/nps-analytics", { params }),
};
