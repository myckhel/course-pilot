import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { STORAGE_KEYS } from "@/constants";
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

// Detect system theme preference
const getSystemTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    immer((set, get) => ({
      // Initial state
      isLoading: false,
      sidebarCollapsed: false,
      theme: getSystemTheme(),
      fontSize: "medium",
      showOnboarding: !localStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN),
      notifications: [],
      themeSetByUser: false, // Track if user has manually set theme

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
          state.themeSetByUser = true; // Mark that user has manually set theme
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
        themeSetByUser: state.themeSetByUser,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If no theme was stored or user hasn't manually set theme, use system preference
          if (!state.theme || !state.themeSetByUser) {
            state.theme = getSystemTheme();
            state.themeSetByUser = false; // Reset flag for system themes
          }
          // Apply theme and font size to document
          document.documentElement.classList.toggle(
            "dark",
            state.theme === "dark"
          );
          const sizes = {
            small: "14px",
            medium: "16px",
            large: "18px",
          };
          document.documentElement.style.fontSize =
            sizes[state.fontSize || "medium"];
        }
      },
    }
  )
);

// Initialize theme and font size on store creation
const initializeTheme = () => {
  const { theme, fontSize } = useUIStore.getState();

  // Apply theme to document
  document.documentElement.classList.toggle("dark", theme === "dark");

  // Apply font size
  const sizes = {
    small: "14px",
    medium: "16px",
    large: "18px",
  };
  document.documentElement.style.fontSize = sizes[fontSize];

  // Listen for system theme changes
  if (typeof window !== "undefined") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only auto-update if user hasn't explicitly set a theme
      const currentState = useUIStore.getState();
      if (!currentState.themeSetByUser) {
        const systemTheme = e.matches ? "dark" : "light";
        // Use internal update to avoid setting themeSetByUser flag
        useUIStore.setState((state) => ({ ...state, theme: systemTheme }));
        document.documentElement.classList.toggle(
          "dark",
          systemTheme === "dark"
        );
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
  }
};

// Initialize on module load
initializeTheme();
