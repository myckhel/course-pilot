import React from "react";
import { Navigate } from "react-router-dom";
import { Result, Button } from "antd";
import { useAuth } from "@/hooks";
import { ROUTES } from "@/constants";
import ProtectedRoute from "./ProtectedRoute";

interface AdminRouteProps {
  children: React.ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, user } = useAuth();

  return (
    <ProtectedRoute>
      {isAdmin ? (
        children
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <Result
            status="403"
            title="Access Denied"
            subTitle="You don't have permission to access this page. Admin access required."
            extra={
              <Button
                type="primary"
                onClick={() => (window.location.href = ROUTES.DASHBOARD)}
              >
                Go to Dashboard
              </Button>
            }
          />
        </div>
      )}
    </ProtectedRoute>
  );
}

export default AdminRoute;
