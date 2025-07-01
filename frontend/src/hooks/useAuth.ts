import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";
import type { LoginRequest, RegisterRequest } from "@/types";

export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadUser,
    clearError,
  } = useAuthStore();

  const handleLogin = useCallback(
    async (credentials: LoginRequest) => {
      await login(credentials);
      // Note: Navigation will be handled by the LoginPage component based on user role
      // This allows for proper redirect handling including admin users
    },
    [login]
  );

  const handleRegister = useCallback(
    async (userData: RegisterRequest) => {
      await register(userData);
      // Note: Navigation will be handled by the RegisterPage component based on user role
      // This allows for proper redirect handling
    },
    [register]
  );

  const handleLogout = useCallback(() => {
    logout();
    navigate(ROUTES.LOGIN);
  }, [logout, navigate]);

  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isStudent,

    // Actions
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    loadUser,
    clearError,
  };
}
