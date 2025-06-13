import type {
  User,
  UserFormData,
  UpdateProfileData,
  ChangePasswordData,
  NotificationSettings,
  ApiResponse,
  NPSData,
} from "@/types";
import apiClient from "./client";

export const userApi = {
  // Get current user profile
  getProfile: (): Promise<ApiResponse<{ user: User }>> =>
    apiClient.get("/user/profile"),

  // Get user statistics
  getStats: (): Promise<
    ApiResponse<{
      stats: {
        total_sessions: number;
        total_messages: number;
        total_topics: number;
        recent_sessions: number;
      };
    }>
  > => apiClient.get("/user/stats"),

  // Get all users (admin only)
  getUsers: (): Promise<ApiResponse<User[]>> => apiClient.get("/admin/users"),

  // Get user by ID
  getUserById: (id: string): Promise<ApiResponse<User>> =>
    apiClient.get(`/admin/users/${id}`),

  // Create new user (admin only)
  createUser: (data: UserFormData): Promise<ApiResponse<User>> =>
    apiClient.post("/admin/users", data),

  // Update user (admin only)
  updateUser: (
    id: string,
    data: Partial<UserFormData>
  ): Promise<ApiResponse<User>> => apiClient.put(`/admin/users/${id}`, data),

  // Delete user (admin only)
  deleteUser: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/admin/users/${id}`),

  // Update own profile
  updateProfile: (
    data: UpdateProfileData
  ): Promise<ApiResponse<{ user: User }>> =>
    apiClient.put("/user/profile", data),

  // Change password
  changePassword: (data: ChangePasswordData): Promise<ApiResponse<void>> =>
    apiClient.put("/user/change-password", data),

  // Upload avatar
  uploadAvatar: (
    formData: FormData
  ): Promise<ApiResponse<{ avatar_url: string }>> =>
    apiClient.post("/user/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Update notification settings
  updateNotificationSettings: (
    data: NotificationSettings
  ): Promise<ApiResponse<void>> => apiClient.put("/user/notifications", data),

  // Export users (admin only)
  exportUsers: (): Promise<ApiResponse<Blob>> =>
    apiClient.get("/admin/users/export", {
      responseType: "blob",
    }),

  // Create API key
  createApiKey: (data: {
    name: string;
    permissions: string[];
  }): Promise<
    ApiResponse<{
      id: string;
      name: string;
      key: string;
      created_at: string;
      permissions: string[];
    }>
  > => apiClient.post("/user/api-keys", data),

  // Delete API key
  deleteApiKey: (keyId: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/user/api-keys/${keyId}`),

  // Get user's API keys
  getApiKeys: (): Promise<
    ApiResponse<
      Array<{
        id: string;
        name: string;
        key: string;
        created_at: string;
        last_used?: string;
        permissions: string[];
      }>
    >
  > => apiClient.get("/user/api-keys"),

  // Get NPS analytics for current user
  getNPSAnalytics: (params?: {
    topic_id?: string;
    days?: number;
  }): Promise<ApiResponse<NPSData>> =>
    apiClient.get("/user/nps-analytics", { params }),
};
