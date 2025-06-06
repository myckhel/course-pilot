// ===== AUTH TYPES =====
export interface User {
  id: string;
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  role: "student" | "admin";
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
  last_login?: string;
}

// ===== ADDITIONAL USER TYPES =====
export interface UserFormData {
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: "student" | "admin";
  status: "active" | "inactive" | "suspended";
  password?: string;
}

export interface UpdateProfileData {
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  digest_frequency: "daily" | "weekly" | "monthly" | "never";
  notification_types: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: "student" | "admin";
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ===== TOPIC TYPES =====
export interface Topic {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "draft";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
  indexed_status: "pending" | "processing" | "completed" | "failed";
}

export interface CreateTopicRequest {
  name: string;
  description: string;
}

export interface TopicDocument {
  id: number;
  filename: string;
  content_preview: string;
  metadata: Record<string, string | number | boolean>;
  chunk_size: number;
}

export interface TopicDocumentsResponse {
  topic_id: string;
  topic_name: string;
  documents: TopicDocument[];
  total_documents: number;
  has_documents: boolean;
}

// ===== DOCUMENT TYPES =====
export interface Document {
  id: string;
  filename: string;
  size: number;
  processing_status: "pending" | "processing" | "processed" | "failed";
  created_at: string;
}

// ===== CHAT TYPES =====
export interface ChatSession {
  id: string;
  topicId: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  message: string;
  sender: "user" | "assistant";
  timestamp: string;
  feedback?: "positive" | "negative" | null;
  sources?: string[];
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
}

export interface MessageResponse {
  aiMessage: ChatMessage;
  userMessage: ChatMessage;
}

export interface CreateSessionRequest {
  topicId?: string; // Use string type for consistency with API
  title: string;
}

// ===== ADMIN TYPES =====
export interface AdminDashboardStats {
  totalTopics: number;
  totalUsers: number;
  totalSessions: number;
  totalDocuments: number;
  activeTopics: number;
  processingSuccess: number;
  activeUsers24h: number;
  messagesToday: number;
  avgSessionTime: number;
  peakHours?: string;
  recentTopics?: Array<{
    id: string;
    title: string;
    documentCount: number;
    createdAt: string;
  }>;
}

// ===== ANALYTICS TYPES =====
export interface AnalyticsData {
  total_messages: number;
  active_users: number;
  topics_accessed: number;
  avg_response_time: number;
}

export interface TopicAnalytics {
  topicId: string;
  topic_name: string;
  total_questions: number;
  unique_users: number;
  avg_response_time: number;
  satisfaction_rate: number;
}

export interface UserAnalytics {
  user_id: string;
  name: string;
  questions_count: number;
  sessions_count: number;
  total_time: number;
  last_active: string;
}

// ===== UI TYPES =====
export interface UIState {
  isLoading: boolean;
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
  fontSize: "small" | "medium" | "large";
  showOnboarding: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

// ===== API RESPONSE TYPES =====
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
}

// ===== FORM TYPES =====
export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "student" | "admin";
}

export interface TopicFormData {
  name: string;
  description: string;
}

// ===== ROUTE TYPES =====
export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  protected?: boolean;
  adminOnly?: boolean;
}
