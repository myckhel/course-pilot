import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { topicsApi } from "@/apis";
import type { Topic, CreateTopicRequest, TopicDocument, TopicDocumentsResponse } from "@/types";

// Helper function to extract error message
const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return err.response?.data?.message || err.message || "An error occurred";
  }
  return "An error occurred";
};

interface TopicsState {
  topics: Topic[];
  selectedTopic: Topic | null;
  documentsResponse: TopicDocumentsResponse | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
}

interface TopicsActions {
  fetchTopics: () => Promise<void>;
  fetchTopicById: (id: string) => Promise<void>;
  createTopic: (data: CreateTopicRequest) => Promise<Topic>;
  updateTopic: (id: string, data: Partial<CreateTopicRequest>) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  fetchDocuments: (topicId: string) => Promise<void>;
  uploadDocument: (topicId: string, file: File) => Promise<TopicDocument>;
  setSelectedTopic: (topic: Topic | null) => void;
  clearError: () => void;
}

export const useTopicsStore = create<TopicsState & TopicsActions>()(
  immer((set) => ({
    // Initial state
    topics: [],
    selectedTopic: null,
    documentsResponse: null,
    isLoading: false,
    isUploading: false,
    error: null,

    // Actions
    fetchTopics: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const topics = await topicsApi.getAll();
        set((state) => {
          state.topics = topics;
          state.isLoading = false;
        });
      } catch (error: unknown) {
        set((state) => {
          state.error = getErrorMessage(error) || "Failed to fetch topics";
          state.isLoading = false;
        });
      }
    },

    fetchTopicById: async (id: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const topic = await topicsApi.getById(id);
        set((state) => {
          state.selectedTopic = topic;
          state.isLoading = false;
        });
      } catch (error: unknown) {
        set((state) => {
          state.error = getErrorMessage(error) || "Failed to fetch topic";
          state.isLoading = false;
        });
      }
    },

    createTopic: async (data: CreateTopicRequest) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const newTopic = await topicsApi.create(data);
        set((state) => {
          state.topics.push(newTopic);
          state.isLoading = false;
        });
        return newTopic;
      } catch (error: unknown) {
        set((state) => {
          state.error = getErrorMessage(error) || "Failed to create topic";
          state.isLoading = false;
        });
        throw error;
      }
    },

    updateTopic: async (id: string, data: Partial<CreateTopicRequest>) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const updatedTopic = await topicsApi.update(id, data);
        set((state) => {
          const index = state.topics.findIndex((t) => t.id === parseInt(id));
          if (index !== -1) {
            state.topics[index] = updatedTopic;
          }
          if (state.selectedTopic?.id === parseInt(id)) {
            state.selectedTopic = updatedTopic;
          }
          state.isLoading = false;
        });
      } catch (error: unknown) {
        set((state) => {
          state.error = getErrorMessage(error) || "Failed to update topic";
          state.isLoading = false;
        });
        throw error;
      }
    },

    deleteTopic: async (id: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        await topicsApi.delete(id);
        set((state) => {
          state.topics = state.topics.filter((t) => t.id !== parseInt(id));
          if (state.selectedTopic?.id === parseInt(id)) {
            state.selectedTopic = null;
          }
          state.isLoading = false;
        });
      } catch (error: unknown) {
        set((state) => {
          state.error = getErrorMessage(error) || "Failed to delete topic";
          state.isLoading = false;
        });
        throw error;
      }
    },

    fetchDocuments: async (topicId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const documentsResponse = await topicsApi.getDocuments(topicId);
        set((state) => {
          state.documentsResponse = documentsResponse;
          state.isLoading = false;
        });
      } catch (error: unknown) {
        set((state) => {
          state.error = getErrorMessage(error) || "Failed to fetch documents";
          state.isLoading = false;
        });
      }
    },

    uploadDocument: async (topicId: string, file: File) => {
      set((state) => {
        state.isUploading = true;
        state.error = null;
      });

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await topicsApi.uploadDocument(topicId, formData);
        set((state) => {
          // Update the topic's document count if we have documentsResponse loaded
          if (state.documentsResponse && state.documentsResponse.topic_id === topicId) {
            state.documentsResponse.total_documents += 1;
            state.documentsResponse.has_documents = true;
          }
          
          // Update the topic's document count in topics list
          const topicIndex = state.topics.findIndex((t) => t.id === parseInt(topicId));
          if (topicIndex !== -1) {
            state.topics[topicIndex].documentCount += 1;
          }
          
          if (state.selectedTopic?.id === parseInt(topicId)) {
            state.selectedTopic.documentCount += 1;
          }
          
          state.isUploading = false;
        });
        return response;
      } catch (error: unknown) {
        set((state) => {
          state.error = getErrorMessage(error) || "Failed to upload document";
          state.isUploading = false;
        });
        throw error;
      }
    },

    setSelectedTopic: (topic: Topic | null) => {
      set((state) => {
        state.selectedTopic = topic;
      });
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },
  }))
);
