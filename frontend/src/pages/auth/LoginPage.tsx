import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, Typography, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "@/hooks";
import { ROUTES } from "@/constants";
import LoginForm from "@/components/features/LoginForm";

const { Title, Paragraph } = Typography;

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user has a specific redirect path from previous location
      const from = location.state?.from?.pathname;

      // If there's a specific redirect path, use it
      if (from) {
        navigate(from, { replace: true });
      } else {
        // Default redirect based on user role
        const defaultRoute =
          user.role === "admin" ? ROUTES.ADMIN : ROUTES.DASHBOARD;
        navigate(defaultRoute, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location.state]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(ROUTES.HOME)}
            className="mb-4"
          >
            Back to Home
          </Button>

          <Title level={2} className="text-center">
            Sign In to GSTutor
          </Title>
          <Paragraph className="text-gray-600 dark:text-gray-400">
            Welcome back! Please sign in to your account.
          </Paragraph>
        </div>

        <Card className="shadow-lg">
          <LoginForm />

          <div className="text-center mt-6">
            <Paragraph>
              Don't have an account?{" "}
              <Button
                type="link"
                onClick={() => navigate(ROUTES.REGISTER)}
                className="p-0"
              >
                Register here
              </Button>
            </Paragraph>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
