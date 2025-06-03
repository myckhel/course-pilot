import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { STORAGE_KEYS, THEME_CONFIG, FONT_SIZES } from "@/constants";
import type { UIState, Notification } from "@/types";

interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  setFontSize: (size: "small" | "medium" | "large") => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setShowOnboarding: (show: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    immer((set, get) => ({
      // Initial state
      isLoading: false,
      sidebarCollapsed: false,
      theme: "light",
      fontSize: "medium",
      showOnboarding: !localStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN),
      notifications: [],

      // Actions
      toggleSidebar: () => {
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        });
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set((state) => {
          state.sidebarCollapsed = collapsed;
        });
      },

      setTheme: (theme: "light" | "dark") => {
        set((state) => {
          state.theme = theme;
        });
        // Apply theme to document
        document.documentElement.classList.toggle("dark", theme === "dark");
      },

      setFontSize: (size: "small" | "medium" | "large") => {
        set((state) => {
          state.fontSize = size;
        });
        // Apply font size to document
        const sizes = {
          small: "14px",
          medium: "16px",
          large: "18px",
        };
        document.documentElement.style.fontSize = sizes[size];
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      addNotification: (notification: Omit<Notification, "id">) => {
        const id = Date.now().toString();
        const newNotification: Notification = {
          ...notification,
          id,
        };

        set((state) => {
          state.notifications.push(newNotification);
        });

        // Auto-remove notification after duration
        if (notification.duration !== 0) {
          const duration = notification.duration || 4500;
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
      },

      removeNotification: (id: string) => {
        set((state) => {
          state.notifications = state.notifications.filter((n) => n.id !== id);
        });
      },

      clearNotifications: () => {
        set((state) => {
          state.notifications = [];
        });
      },

      setShowOnboarding: (show: boolean) => {
        set((state) => {
          state.showOnboarding = show;
        });

        if (!show) {
          localStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, "true");
        }
      },
    })),
    {
      name: "ui-storage",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        fontSize: state.fontSize,
      }),
    }
  )
);

// Initialize theme and font size on store creation
const { theme, fontSize } = useUIStore.getState();
document.documentElement.classList.toggle("dark", theme === "dark");
const sizes = {
  small: "14px",
  medium: "16px",
  large: "18px",
};
document.documentElement.style.fontSize = sizes[fontSize];
