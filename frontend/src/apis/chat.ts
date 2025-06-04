import apiClient from "./client";
import { API_ENDPOINTS } from "@/constants";
import type {
  ChatSession,
  ChatMessage,
  CreateSessionRequest,
  SendMessageRequest,
  MessageResponse,
} from "@/types";

interface NewSessionResponse {
  session: ChatSession;
  message: string;
}

export const chatApi = {
  getSessions: async (topicId?: string): Promise<ChatSession[]> => {
    const params = topicId ? { topicId } : {}; // Only include topicId if provided
    const response = await apiClient.get<ChatSession[]>(
      API_ENDPOINTS.CHAT_SESSIONS,
      { params }
    );
    return response.data!;
  },

  createSession: async (
    data: CreateSessionRequest
  ): Promise<NewSessionResponse> => {
    // If no topicId provided, the backend will use the default GST topic
    const response = await apiClient.post<NewSessionResponse>(
      API_ENDPOINTS.CHAT_SESSIONS,
      data
    );
    return response.data!;
  },

  getSession: async (sessionId: string): Promise<ChatSession> => {
    const response = await apiClient.get<ChatSession>(
      API_ENDPOINTS.CHAT_SESSION_DETAIL(sessionId)
    );
    return response.data!;
  },

  updateSession: async (
    sessionId: string,
    data: Partial<CreateSessionRequest>
  ): Promise<ChatSession> => {
    const response = await apiClient.put<ChatSession>(
      API_ENDPOINTS.CHAT_SESSION_DETAIL(sessionId),
      data
    );
    return response.data!;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CHAT_SESSION_DETAIL(sessionId));
  },

  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get<ChatMessage[]>(
      API_ENDPOINTS.CHAT_MESSAGES(sessionId)
    );
    return response.data!;
  },

  sendMessage: async (data: SendMessageRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      API_ENDPOINTS.SEND_MESSAGE,
      data
    );
    return response.data!;
  },

  updateMessageFeedback: async (
    messageId: string,
    feedback: "positive" | "negative" | null
  ): Promise<ChatMessage> => {
    const response = await apiClient.patch<ChatMessage>(
      `/api/chat/messages/${messageId}/feedback`,
      { feedback }
    );
    return response.data!;
  },
};
