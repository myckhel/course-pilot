import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Typography, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "@/hooks";
import { ROUTES } from "@/constants";
import RegisterForm from "@/components/features/RegisterForm";

const { Title, Paragraph } = Typography;

function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, navigate]);

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
            Join GSTutor
          </Title>
          <Paragraph className="text-gray-600 dark:text-gray-400">
            Create your account to start learning with AI assistance.
          </Paragraph>
        </div>

        <Card className="shadow-lg">
          <RegisterForm />

          <div className="text-center mt-6">
            <Paragraph>
              Already have an account?{" "}
              <Button
                type="link"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="p-0"
              >
                Sign in here
              </Button>
            </Paragraph>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default RegisterPage;
