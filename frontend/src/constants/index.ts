// ===== ROUTES =====
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  ONBOARDING: "/onboarding",
  DASHBOARD: "/dashboard",
  CHATS: "/chats",
  CHAT: "/chat/:sessionId",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin",
  ADMIN_TOPICS: "/admin/topics",
  ADMIN_TOPIC_DETAIL: "/admin/topics/:topicId",
  ADMIN_TOPIC_DOCUMENTS: "/admin/topics/:topicId/documents",
} as const;

export const ADMIN_ROUTES = {
  DASHBOARD: "/admin",
  TOPICS: "/admin/topics",
  USERS: "/admin/users",
  ANALYTICS: "/admin/analytics",
} as const;

// ===== API ENDPOINTS =====
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  ME: "/auth/me",
  REFRESH: "/auth/refresh",

  // Topics
  TOPICS: "/topics",
  TOPIC_DETAIL: (id: string) => `/topics/${id}`,
  TOPIC_DOCUMENTS: (id: string) => `/topics/${id}/documents`,

  // Chat
  CHAT_SESSIONS: "/chat/sessions",
  CHAT_SESSION_DETAIL: (id: string) => `/chat/sessions/${id}`,
  CHAT_MESSAGES: (sessionId: string) => `/chat/sessions/${sessionId}/messages`,
  SEND_MESSAGE: "/chat/message",

  // Admin
  ADMIN_DASHBOARD: "/admin/dashboard",
} as const;

// ===== STORAGE KEYS =====
export const STORAGE_KEYS = {
  AUTH_TOKEN: "asked_auth_token",
  USER_DATA: "asked_user_data",
  THEME: "asked_theme",
  FONT_SIZE: "asked_font_size",
  ONBOARDING_SEEN: "asked_onboarding_seen",
  SIDEBAR_COLLAPSED: "asked_sidebar_collapsed",
} as const;

// ===== THEME CONFIG =====
export const THEME_CONFIG = {
  LIGHT: "light",
  DARK: "dark",
} as const;

export const FONT_SIZES = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
} as const;

// ===== FILE UPLOAD CONFIG =====
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_TYPES: ["application/pdf"],
  ALLOWED_EXTENSIONS: [".pdf"],
} as const;

// ===== UI CONFIG =====
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 280,
  SIDEBAR_COLLAPSED_WIDTH: 64,
  HEADER_HEIGHT: 64,
  CHAT_INPUT_MAX_HEIGHT: 120,
  MESSAGE_MAX_LENGTH: 1000,
  SESSION_TITLE_MAX_LENGTH: 50,
} as const;

// ===== NOTIFICATION CONFIG =====
export const NOTIFICATION_CONFIG = {
  DEFAULT_DURATION: 4.5,
  SUCCESS_DURATION: 3,
  ERROR_DURATION: 6,
  WARNING_DURATION: 5,
} as const;

// ===== USER ROLES =====
export const USER_ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
} as const;

// ===== PROCESSING STATUS =====
export const PROCESSING_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

// ===== MESSAGE ROLES =====
export const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
} as const;

// ===== DEFAULT VALUES =====
export const DEFAULT_VALUES = {
  PAGINATION: {
    PAGE: 1,
    PER_PAGE: 20,
  },
  TOPIC: {
    NAME: "",
    DESCRIPTION: "",
  },
  CHAT: {
    TITLE: "New Chat Session",
  },
} as const;
