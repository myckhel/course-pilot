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
  BookOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTopicsStore, useChatStore } from "@/stores";
import { formatDistanceToNow } from "@/utils";
import type { Topic, ChatSession } from "@/types";

const { Title, Text } = Typography;

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const { topics, fetchTopics } = useTopicsStore();
  const { sessions, fetchSessions } = useChatStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTopics(), fetchSessions()]);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchTopics, fetchSessions]);

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

  const availableTopics = topics
    .filter((topic) => topic.status === "active")
    .slice(0, 6);

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
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Available Topics"
              value={topics.filter((t) => t.status === "active").length}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Chat Sessions"
              value={sessions.length}
              prefix={<MessageOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Topics"
              value={recentSessions.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Available Topics */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex justify-between items-center">
                <span>Available Topics</span>
                <Button
                  type="link"
                  onClick={() => navigate("/topics")}
                  icon={<RightOutlined />}
                  className="p-0"
                >
                  View All
                </Button>
              </div>
            }
            className="h-full"
          >
            {availableTopics.length > 0 ? (
              <List
                dataSource={availableTopics}
                renderItem={(topic: Topic) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        onClick={() => navigate(`/chat?topicId=${topic.id}`)}
                        key="start-chat"
                      >
                        Start Chat
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<BookOutlined className="text-blue-500" />}
                      title={topic.name}
                      description={
                        <div>
                          <Text type="secondary">{topic.description}</Text>
                          <br />
                          <Text type="secondary" className="text-xs">
                            {topic.document_count} documents
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No topics available yet" />
            )}
          </Card>
        </Col>

        {/* Recent Chat Sessions */}
        <Col xs={24} lg={12}>
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
            className="h-full"
          >
            {recentSessions.length > 0 ? (
              <List
                dataSource={recentSessions}
                renderItem={(session: ChatSession) => {
                  const topic = topics.find(
                    (t) => t.id === session.topicId.toString()
                  );
                  return (
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
                        description={
                          <div>
                            <Text type="secondary">
                              {topic?.name || "Unknown Topic"}
                            </Text>
                            <br />
                            <Text type="secondary" className="text-xs">
                              {formatDistanceToNow(
                                new Date(session.updated_at)
                              )}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Empty description="No chat sessions yet">
                <Button type="primary" onClick={() => navigate("/topics")}>
                  Start Your First Chat
                </Button>
              </Empty>
            )}
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              size="large"
              icon={<BookOutlined />}
              onClick={() => navigate("/chats")}
              className="w-full h-20 flex flex-col items-center justify-center"
            >
              Chat Sessions
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              size="large"
              icon={<MessageOutlined />}
              onClick={() => navigate("/chat")}
              className="w-full h-20 flex flex-col items-center justify-center"
            >
              Chat Sessions
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default DashboardPage;
