import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { authApi } from "@/apis";
import { STORAGE_KEYS } from "@/constants";
import type { User, LoginRequest, RegisterRequest } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    immer((set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await authApi.login(credentials);

          set((state) => {
            state.user = response.user;
            state.token = response.token;
            state.isAuthenticated = true;
            state.isLoading = false;
          });

          // Store token in localStorage for axios interceptor
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? // @ts-expect-error ddd
                error?.response?.data?.error || error.message
              : "Login failed";
          set((state) => {
            state.error = errorMessage;
            state.isLoading = false;
          });
          throw error;
        }
      },

      register: async (userData: RegisterRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await authApi.register(userData);

          set((state) => {
            state.user = response.user;
            state.token = response.token;
            state.isAuthenticated = true;
            state.isLoading = false;
          });

          // Store token in localStorage for axios interceptor
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Registration failed";
          set((state) => {
            state.error = errorMessage;
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

        // Clear localStorage
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      },

      loadUser: async () => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!token) return;

        set((state) => {
          state.isLoading = true;
        });

        try {
          const user = await authApi.getMe();

          set((state) => {
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch {
          // If token is invalid, clear auth state
          set((state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isLoading = false;
          });
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        }
      },

      updateUser: (user: User) => {
        set((state) => {
          state.user = user;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading;
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

// Listen for unauthorized events from axios interceptor
window.addEventListener("auth:unauthorized", () => {
  useAuthStore.getState().logout();
});
