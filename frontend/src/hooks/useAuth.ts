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
      navigate(ROUTES.DASHBOARD);
    },
    [login, navigate]
  );

  const handleRegister = useCallback(
    async (userData: RegisterRequest) => {
      await register(userData);
      navigate(ROUTES.DASHBOARD);
    },
    [register, navigate]
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
