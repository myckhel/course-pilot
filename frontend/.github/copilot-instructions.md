## Project Overview:

### **APPLICATION OF ARTIFICIAL INTELLIGENCE FOR VIRTUAL TEACHING ASSISTANCE**

This project is a **lightweight AI-powered assistant** designed to enhance the **learning experience of students in higher education**. Users can ask questions in natural language based data trained by a RAG model at the backend, and receive intelligent, context-aware answers directly sourced from the trained data.

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Ant Design (antd)
- **Routing**: React Router v6
- **State Management**: Zustand + persist + immer
- **HTTP Client**: Axios
- **Build Tool**: Vite

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Modal, etc.)
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   └── features/        # Feature-specific components
├── pages/               # Route components
│   ├── auth/           # Login, Register pages
│   ├── student/        # Student dashboard, Q&A interface
│   └── admin/          # Admin panel, topic management
├── stores/             # Zustand stores
│   ├── authStore.ts    # Authentication state
│   ├── topicStore.ts   # Topics management
│   └── chatStore.ts    # Chat sessions and messages
├── hooks/              # Custom React hooks
├── services/           # API service functions
├── utils/              # Helper functions
├── types/              # TypeScript type definitions
├── constants/          # App constants
└── styles/             # Global styles and Tailwind config
```

## 🎯 TypeScript Guidelines

### **Type Definitions**

```typescript
// types/auth.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  createdAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// types/topic.ts
export interface Topic {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: "user" | "assistant";
  message: string;
  timestamp: string;
  sources?: string[];
}

export interface ChatSession {
  id: string;
  userId: string;
  topicId: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}
```

### **Component Structure with TypeScript**

```typescript
// components/features/QuestionInput.tsx
import React, { useState } from "react";
import { Button, Input, Form, message } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useChatStore } from "@/stores/chatStore";

interface QuestionInputProps {
  topicId: string;
  onQuestionSubmit?: (question: string) => void;
  disabled?: boolean;
}

const QuestionInput: React.FC<QuestionInputProps> = ({
  topicId,
  onQuestionSubmit,
  disabled = false,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { sendMessage } = useChatStore();

  const handleSubmit = async (values: { question: string }) => {
    if (!values.question.trim()) return;

    setLoading(true);
    try {
      await sendMessage(topicId, values.question);
      form.resetFields();
      onQuestionSubmit?.(values.question);
    } catch (error) {
      message.error("Failed to send question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      className="flex gap-2 p-4 border-t bg-gray-50"
    >
      <Form.Item
        name="question"
        className="flex-1 mb-0"
        rules={[{ required: true, message: "Please enter a question" }]}
      >
        <Input.TextArea
          placeholder="Ask a question about this topic..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={disabled || loading}
          className="resize-none"
        />
      </Form.Item>

      <Form.Item className="mb-0">
        <Button
          type="primary"
          htmlType="submit"
          icon={<SendOutlined />}
          loading={loading}
          disabled={disabled}
          className="h-10"
        >
          Send
        </Button>
      </Form.Item>
    </Form>
  );
};

export default QuestionInput;
```

### **Zustand Store with TypeScript**

```typescript
// stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { User, AuthCredentials, AuthResponse } from "@/types/auth";
import { authService } from "@/services/authService";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: AuthCredentials) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response: AuthResponse = await authService.login(credentials);

          set((state) => {
            state.user = response.user;
            state.token = response.token;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error =
              error instanceof Error ? error.message : "Login failed";
            state.isLoading = false;
          });
          throw error;
        }
      },

      logout: () => {
        set((state) => {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          state.error = null;
        });
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response: AuthResponse = await authService.refreshToken();

          set((state) => {
            state.token = response.token;
            state.user = response.user;
          });
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### **API Service with TypeScript**

```typescript
// services/apiService.ts
import axios, { AxiosResponse } from "axios";
import type { AuthCredentials, AuthResponse, User } from "@/types/auth";
import type { Topic, ChatSession, ChatMessage } from "@/types/topic";
import { useAuthStore } from "@/stores/authStore";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await useAuthStore.getState().refreshToken();
        // Retry the original request
        return apiClient.request(error.config);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await apiClient.post(
      "/auth/login",
      credentials
    );
    return response.data;
  },

  register: async (
    userData: Omit<User, "id" | "createdAt"> & { password: string }
  ): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await apiClient.post(
      "/auth/register",
      userData
    );
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await apiClient.post(
      "/auth/refresh"
    );
    return response.data;
  },
};

// Topic Service
export const topicService = {
  getTopics: async (): Promise<Topic[]> => {
    const response: AxiosResponse<Topic[]> = await apiClient.get("/topics");
    return response.data;
  },

  createTopic: async (
    topicData: Omit<Topic, "id" | "createdAt" | "updatedAt" | "documentCount">
  ): Promise<Topic> => {
    const response: AxiosResponse<Topic> = await apiClient.post(
      "/topics",
      topicData
    );
    return response.data;
  },

  uploadDocument: async (
    topicId: string,
    file: File
  ): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response: AxiosResponse<{ message: string }> = await apiClient.post(
      `/topics/${topicId}/documents`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },
};

// Chat Service
export const chatService = {
  getChatSessions: async (topicId: string): Promise<ChatSession[]> => {
    const response: AxiosResponse<ChatSession[]> = await apiClient.get(
      `/chat/sessions?topicId=${topicId}`
    );
    return response.data;
  },

  sendMessage: async (
    sessionId: string,
    message: string
  ): Promise<ChatMessage> => {
    const response: AxiosResponse<ChatMessage> = await apiClient.post(
      "/chat/message",
      {
        sessionId,
        message,
      }
    );
    return response.data;
  },

  createSession: async (
    topicId: string,
    title: string
  ): Promise<ChatSession> => {
    const response: AxiosResponse<ChatSession> = await apiClient.post(
      "/chat/sessions",
      {
        topicId,
        title,
      }
    );
    return response.data;
  },
};
```

### **React Router with TypeScript**

```typescript
// App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { useAuthStore } from "@/stores/authStore";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DashboardPage from "@/pages/student/DashboardPage";
import TopicsPage from "@/pages/admin/TopicsPage";
import ChatPage from "@/pages/student/ChatPage";

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="topics" element={<TopicsPage />} />
              <Route path="chat/:topicId" element={<ChatPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
```

### **Custom Hook with TypeScript**

```typescript
// hooks/useApi.ts
import { useState, useEffect } from "react";
import { message } from "antd";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
}

export const useApi = <T>(
  apiCall: () => Promise<T>,
  dependencies: React.DependencyList = []
): UseApiReturn<T> => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An error occurred");
      setState({ data: null, loading: false, error });
      message.error(error.message || "Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { ...state, refetch: fetchData };
};

// Usage example:
// const { data: topics, loading, error, refetch } = useApi(() => topicService.getTopics(), []);
```

### **Environment Variables with TypeScript**

```typescript
// types/env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_OPENAI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### **Vite Configuration**

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

## 🎨 Tailwind + Antd Best Practices

### **Styling Guidelines**

```typescript
// Use Tailwind for layout, spacing, and responsive design
// Use Antd's built-in styling for component appearance

const ChatInterface: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-white border-b shadow-sm">
        <Typography.Title level={3} className="m-0">
          AI Teaching Assistant
        </Typography.Title>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <Card
              className={`max-w-xs md:max-w-md ${
                message.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
              size="small"
            >
              {message.message}
            </Card>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0">
        <QuestionInput topicId={topicId} />
      </div>
    </div>
  );
};
```

## 📋 Best Practices

### **TypeScript**

1. **Strict Mode**: Always use strict TypeScript configuration
2. **Type Definitions**: Create comprehensive type definitions for all data structures
3. **Generic Types**: Use generics for reusable components and hooks
4. **Utility Types**: Leverage TypeScript utility types (Pick, Omit, Partial, etc.)

### **Code Organization**

1. **Barrel Exports**: Use index.ts files for clean imports
2. **Consistent Naming**: PascalCase for components, camelCase for functions/variables
3. **File Structure**: Group related files in feature folders

### **Performance**

1. **React.memo**: Memoize expensive components
2. **useCallback/useMemo**: Optimize re-renders and computations
3. **Code Splitting**: Use React.lazy for route-based splitting

### **Error Handling**

1. **Error Boundaries**: Implement error boundaries for graceful failures
2. **Try-Catch**: Wrap all async operations
3. **User Feedback**: Always provide user feedback for errors

### **State Management**

1. **Single Responsibility**: Each store should handle one domain
2. **Immutable Updates**: Use Immer for clean state updates
3. **Selective Persistence**: Only persist necessary state

## 🔧 Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```
