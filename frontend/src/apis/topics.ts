import apiClient from "./client";
import { API_ENDPOINTS } from "@/constants";
import type {
  Topic,
  CreateTopicRequest,
  TopicDocument,
  TopicDocumentsResponse,
  Document,
} from "@/types";
import type { AxiosResponse } from "axios";

export const topicsApi = {
  getAll: async (): Promise<Topic[]> => {
    const response = await apiClient.get<Topic[]>(API_ENDPOINTS.TOPICS);
    return response.data!;
  },

  getById: async (id: string): Promise<Topic> => {
    const response = await apiClient.get<Topic>(`/topics/${id}`);
    return response.data!;
  },

  create: async (data: CreateTopicRequest): Promise<Topic> => {
    const response = await apiClient.post<Topic>(API_ENDPOINTS.TOPICS, data);
    return response.data!;
  },

  update: async (
    id: string,
    data: Partial<CreateTopicRequest>
  ): Promise<Topic> => {
    const response = await apiClient.put<Topic>(`/topics/${id}`, data);
    return response.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/topics/${id}`);
  },

  getDocuments: async (topicId: string): Promise<TopicDocumentsResponse> => {
    const response = await apiClient.get<TopicDocumentsResponse>(
      `/topics/${topicId}/documents`
    );
    return response.data!;
  },

  uploadDocument: async (
    topicId: string,
    formData: FormData
  ): Promise<TopicDocument> => {
    const response = await apiClient.post<TopicDocument>(
      `/topics/${topicId}/documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data!;
  },
};

// New topicApi for consistency with components
export const topicApi = {
  // Get all topics
  getTopics: (): Promise<AxiosResponse<Topic[]>> => apiClient.get("/topics"),

  // Get topic by ID
  getTopicById: (id: string): Promise<AxiosResponse<Topic>> =>
    apiClient.get(`/topics/${id}`),

  // Create topic
  createTopic: (
    data: CreateTopicRequest & { status?: string }
  ): Promise<AxiosResponse<Topic>> => apiClient.post("/topics", data),

  // Update topic
  updateTopic: (
    id: string,
    data: Partial<CreateTopicRequest & { status?: string }>
  ): Promise<AxiosResponse<Topic>> => apiClient.put(`/topics/${id}`, data),

  // Delete topic
  deleteTopic: (id: string): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/topics/${id}`),

  // Get topic documents
  getTopicDocuments: (topicId: string): Promise<AxiosResponse<Document[]>> =>
    apiClient.get(`/topics/${topicId}/documents`),

  // Upload documents
  uploadDocuments: (
    topicId: string,
    formData: FormData
  ): Promise<AxiosResponse<Document[]>> =>
    apiClient.post(`/topics/${topicId}/documents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Delete document
  deleteDocument: (documentId: string): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/documents/${documentId}`),

  // Download document
  downloadDocument: (documentId: string): Promise<AxiosResponse<Blob>> =>
    apiClient.get(`/documents/${documentId}/download`, {
      responseType: "blob",
    }),

  // Get topic statistics
  getTopicStats: (
    topicId: string
  ): Promise<
    AxiosResponse<{
      total_questions: number;
      unique_users: number;
      avg_response_time: number;
      satisfaction_rate: number;
    }>
  > => apiClient.get(`/topics/${topicId}/stats`),
};
