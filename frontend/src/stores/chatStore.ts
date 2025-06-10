import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { chatApi } from "@/apis";
import type {
  ChatSession,
  ChatMessage,
  CreateSessionRequest,
  SendMessageRequest,
} from "@/types";

interface ChatState {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  typingIndicator: boolean;
}

interface ChatActions {
  fetchSessions: (topicId?: string) => Promise<void>;
  createSession: (data: CreateSessionRequest) => Promise<ChatSession>;
  setCurrentSession: (session: ChatSession | null) => void;
  fetchMessages: (sessionId: string) => Promise<void>;
  sendMessage: (data: SendMessageRequest) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateMessageFeedback: (
    messageId: string,
    rating: "positive" | "negative" | null
  ) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  setTypingIndicator: (typing: boolean) => void;
}

export const useChatStore = create<ChatState & ChatActions>()(
  immer((set) => ({
    // Initial state
    sessions: [],
    currentSession: null,
    messages: [],
    isLoading: false,
    isSending: false,
    error: null,
    typingIndicator: false,

    // Actions
    fetchSessions: async (topicId?: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        // Will use default GST topic if no topicId provided
        const sessions = await chatApi.getSessions(topicId);
        set((state) => {
          state.sessions = sessions;
          state.isLoading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message ||
            error.message ||
            "Failed to fetch sessions";
          state.isLoading = false;
        });
      }
    },

    createSession: async (data: CreateSessionRequest) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        // Will use default GST topic if no topicId provided in data
        const newSession = await chatApi.createSession(data);
        set((state) => {
          state.sessions.unshift(newSession.session); // Add to beginning of list
          state.currentSession = newSession.session;
          state.messages = []; // Clear messages for new session
          state.isLoading = false;
        });
        return newSession.session;
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message ||
            error.message ||
            "Failed to create session";
          state.isLoading = false;
        });
        throw error;
      }
    },

    setCurrentSession: (session: ChatSession | null) => {
      set((state) => {
        state.currentSession = session;
        state.messages = []; // Clear messages when switching sessions
      });
    },

    fetchMessages: async (sessionId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const messages = await chatApi.getMessages(sessionId);
        set((state) => {
          state.messages = messages;
          state.isLoading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message ||
            error.message ||
            "Failed to fetch messages";
          state.isLoading = false;
        });
      }
    },

    sendMessage: async (data: SendMessageRequest) => {
      set((state) => {
        state.isSending = true;
        state.typingIndicator = true;
        state.error = null;
      });

      let userMessage: ChatMessage;

      try {
        // Add user message immediately for better UX
        userMessage = {
          id: Date.now() + "", // Temporary ID
          sessionId: data.sessionId,
          message: data.message,
          sender: "user",
          timestamp: new Date().toISOString(),
        };

        set((state) => {
          state.messages.push(userMessage);
        });

        const response = await chatApi.sendMessage(data);

        // Update the user message with real ID and add assistant response
        set((state) => {
          // Remove temporary user message and add real one
          state.messages = state.messages.filter(
            (m) => m.id !== userMessage.id
          );
          state.messages.push(response.userMessage);

          // Add assistant response
          state.messages.push(response.aiMessage);

          // Update session message count
          const sessionIndex = state.sessions.findIndex(
            (s) => s.id === data.sessionId
          );
          if (sessionIndex !== -1) {
            state.sessions[sessionIndex].message_count += 2; // User + assistant
            state.sessions[sessionIndex].updated_at = new Date().toISOString();
          }
          if (state.currentSession?.id === data.sessionId) {
            state.currentSession.message_count += 2;
            state.currentSession.updated_at = new Date().toISOString();
          }

          state.isSending = false;
          state.typingIndicator = false;
        });
      } catch (error: any) {
        // Remove the temporary user message on error
        set((state) => {
          state.messages = state.messages.filter(
            (m) => m.id !== userMessage.id
          );
          state.error =
            error.response?.data?.message ||
            error.message ||
            "Failed to send message";
          state.isSending = false;
          state.typingIndicator = false;
        });
        throw error;
      }
    },

    updateSessionTitle: async (sessionId: string, title: string) => {
      try {
        const updatedSession = await chatApi.updateSession(sessionId, {
          title,
        });
        set((state) => {
          const sessionIndex = state.sessions.findIndex(
            (s) => s.id === sessionId
          );
          if (sessionIndex !== -1) {
            state.sessions[sessionIndex] = updatedSession;
          }
          if (state.currentSession?.id === sessionId) {
            state.currentSession = updatedSession;
          }
        });
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message ||
            error.message ||
            "Failed to update session title";
        });
        throw error;
      }
    },

    deleteSession: async (sessionId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        await chatApi.deleteSession(sessionId);
        set((state) => {
          state.sessions = state.sessions.filter((s) => s.id !== sessionId);
          if (state.currentSession?.id === sessionId) {
            state.currentSession = null;
            state.messages = [];
          }
          state.isLoading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message ||
            error.message ||
            "Failed to delete session";
          state.isLoading = false;
        });
        throw error;
      }
    },

    updateMessageFeedback: async (
      messageId: string,
      rating: "positive" | "negative" | null
    ) => {
      try {
        const updatedMessage = await chatApi.updateMessageFeedback(
          messageId,
          rating
        );
        set((state) => {
          const messageIndex = state.messages.findIndex(
            (m) => m.id === messageId
          );
          if (messageIndex !== -1) {
            state.messages[messageIndex] = updatedMessage;
          }
        });
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message ||
            error.message ||
            "Failed to update rating";
        });
        throw error;
      }
    },

    clearMessages: () => {
      set((state) => {
        state.messages = [];
      });
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },

    setTypingIndicator: (typing: boolean) => {
      set((state) => {
        state.typingIndicator = typing;
      });
    },
  }))
);
