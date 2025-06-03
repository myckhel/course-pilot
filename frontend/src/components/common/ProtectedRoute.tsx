import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "@/hooks";
import { ROUTES } from "@/constants";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, loadUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Try to load user from token if not already authenticated
    if (!isAuthenticated && !isLoading) {
      loadUser();
    }
  }, [isAuthenticated, isLoading, loadUser]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
