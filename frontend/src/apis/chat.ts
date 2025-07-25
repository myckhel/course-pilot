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
    // Create FormData if there's an attachment, otherwise use JSON
    if (data.attachment) {
      const formData = new FormData();
      formData.append("sessionId", data.sessionId);
      formData.append("message", data.message);
      formData.append("attachment", data.attachment);

      const response = await apiClient.post<MessageResponse>(
        API_ENDPOINTS.SEND_MESSAGE,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data!;
    } else {
      // Use JSON for messages without attachments
      const response = await apiClient.post<MessageResponse>(
        API_ENDPOINTS.SEND_MESSAGE,
        { sessionId: data.sessionId, message: data.message }
      );
      return response.data!;
    }
  },

  updateMessageFeedback: async (
    messageId: string,
    rating: "positive" | "negative" | null
  ): Promise<ChatMessage> => {
    const response = await apiClient.patch<{ message: ChatMessage }>(
      `/chat/messages/${messageId}/rating`,
      { rating }
    );
    return response.data!.message;
  },
};
