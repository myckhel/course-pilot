import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  List,
  Button,
  Typography,
  Empty,
  Spin,
} from "antd";
import {
  MessageOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "@/stores";
import { formatDistanceToNow } from "@/utils";
import type { ChatSession } from "@/types";

const { Title, Text } = Typography;

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { sessions, fetchSessions } = useChatStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchSessions();
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchSessions]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const recentSessions = sessions
    // .sort(
    //   (a, b) =>
    //     new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    // )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <Title level={2} className="text-white mb-2">
          Welcome to GSTutor! 👋
        </Title>
        <Text className="text-blue-100 text-lg">
          Your AI-powered learning companion is ready to help you with your
          studies.
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total Chat Sessions"
              value={sessions.length}
              prefix={<MessageOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Recent Sessions"
              value={recentSessions.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Chat Sessions */}
      <Row>
        <Card
          title={
            <div className="flex justify-between items-center">
              <span>Recent Chat Sessions</span>
              <Button
                type="link"
                onClick={() => navigate("/chat")}
                icon={<RightOutlined />}
                className="p-0"
              >
                View All
              </Button>
            </div>
          }
          className="h-full w-full"
        >
          {recentSessions.length > 0 ? (
            <List
              dataSource={recentSessions}
              renderItem={(session: ChatSession) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      onClick={() => navigate(`/chat/${session.id}`)}
                      key="continue"
                    >
                      Continue
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<MessageOutlined className="text-green-500" />}
                    title={session.title || "Untitled Session"}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No chat sessions yet">
              <Button type="primary" onClick={() => navigate("/chat")}>
                Start Your First Chat
              </Button>
            </Empty>
          )}
        </Card>
      </Row>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <Row gutter={[16, 16]} className="justify-center">
          <Col xs={24} sm={12} md={8}>
            <Button
              type="primary"
              size="large"
              icon={<MessageOutlined />}
              onClick={() => navigate("/chats")}
              className="w-full h-20 flex items-center justify-center"
            >
              Start New Chat
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default DashboardPage;
