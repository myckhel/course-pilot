import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Row, Col, Typography, Space } from "antd";
import { BookOutlined, MessageOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "@/hooks";
import { ROUTES } from "@/constants";
import LoginForm from "@/components/features/LoginForm";

const { Title, Paragraph } = Typography;

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <Row gutter={[32, 32]} align="middle" className="min-h-screen">
          {/* Left Side - Features and Info */}
          <Col xs={24} lg={12}>
            <div className="text-center lg:text-left">
              <Title level={1} className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="text-blue-600">GSTutor</span> AI Assistant
              </Title>

              <Paragraph className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Your intelligent study companion powered by AI. Ask questions
                about your course materials and get instant, context-aware
                answers.
              </Paragraph>

              <Row gutter={[16, 16]} className="mb-8">
                <Col xs={24} sm={8}>
                  <Card className="text-center h-full" bordered={false}>
                    <BookOutlined className="text-3xl text-blue-500 mb-4" />
                    <Title level={4}>Study Materials</Title>
                    <Paragraph className="text-gray-600">
                      Upload your PDFs and course materials for AI-powered
                      learning.
                    </Paragraph>
                  </Card>
                </Col>

                <Col xs={24} sm={8}>
                  <Card className="text-center h-full" bordered={false}>
                    <MessageOutlined className="text-3xl text-green-500 mb-4" />
                    <Title level={4}>Smart Q&A</Title>
                    <Paragraph className="text-gray-600">
                      Ask questions in natural language and get accurate
                      answers.
                    </Paragraph>
                  </Card>
                </Col>

                <Col xs={24} sm={8}>
                  <Card className="text-center h-full" bordered={false}>
                    <UserOutlined className="text-3xl text-purple-500 mb-4" />
                    <Title level={4}>Personalized</Title>
                    <Paragraph className="text-gray-600">
                      Track your learning progress and chat history.
                    </Paragraph>
                  </Card>
                </Col>
              </Row>

              <Space size="large" className="hidden lg:flex">
                <Button
                  type="default"
                  size="large"
                  onClick={() => navigate(ROUTES.REGISTER)}
                >
                  Get Started
                </Button>
                <Button
                  type="link"
                  size="large"
                  onClick={() => navigate(ROUTES.LOGIN)}
                >
                  Already have an account?
                </Button>
              </Space>
            </div>
          </Col>

          {/* Right Side - Login Form */}
          <Col xs={24} lg={12}>
            <Card className="max-w-md mx-auto shadow-lg">
              <div className="text-center mb-6">
                <Title level={3}>Welcome Back</Title>
                <Paragraph className="text-gray-600">
                  Sign in to continue your learning journey
                </Paragraph>
              </div>

              <LoginForm />

              <div className="text-center mt-6">
                <Button type="link" onClick={() => navigate(ROUTES.REGISTER)}>
                  Don't have an account? Register here
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default LandingPage;
