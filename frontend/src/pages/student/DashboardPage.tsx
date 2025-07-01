import { useEffect, useState, useCallback } from "react";
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
  Select,
} from "antd";
import {
  MessageOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "@/stores";
import { userApi } from "@/apis";
import NPSChart from "@/components/features/NPSChart";
import type { ChatSession, NPSData } from "@/types";

const { Title, Text } = Typography;

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [npsLoading, setNpsLoading] = useState(false);
  const [npsData, setNpsData] = useState<NPSData | null>(null);
  const [npsTimeRange, setNpsTimeRange] = useState(30);
  const { sessions, fetchSessions } = useChatStore();

  const loadNPSData = useCallback(async () => {
    setNpsLoading(true);
    try {
      const response = await userApi.getNPSAnalytics({ days: npsTimeRange });
      setNpsData(response.data);
    } catch (error) {
      console.error("Failed to load NPS data:", error);
    } finally {
      setNpsLoading(false);
    }
  }, [npsTimeRange]);

  useEffect(() => {
    loadNPSData();
  }, [loadNPSData]);

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
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 sm:p-6 text-white">
        <Title level={2} className="text-white mb-2 text-xl sm:text-2xl">
          Welcome to GSTutor!
        </Title>
        <Text className="text-blue-100 text-sm sm:text-lg">
          Your AI-powered learning companion is ready to help you with your
          studies.
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[12, 12]} className="sm:gutter-16">
        <Col xs={24} sm={12}>
          <Card className="h-full">
            <Statistic
              title="Total Chat Sessions"
              value={sessions.length}
              prefix={<MessageOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className="h-full">
            <Statistic
              title="Recent Sessions"
              value={recentSessions.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* NPS Analytics Section */}
      <Row>
        <Col xs={24}>
          <Card
            title={
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <span className="text-sm sm:text-base">
                  Your Learning Experience Rating
                </span>
                <div className="flex items-center space-x-2">
                  <Select
                    value={npsTimeRange}
                    onChange={setNpsTimeRange}
                    size="small"
                    style={{ width: 120 }}
                  >
                    <Select.Option value={7}>Last 7 days</Select.Option>
                    <Select.Option value={30}>Last 30 days</Select.Option>
                    <Select.Option value={90}>Last 90 days</Select.Option>
                  </Select>
                </div>
              </div>
            }
          >
            <Row>
              <NPSChart
                data={npsData}
                loading={npsLoading}
                title=""
                showDailyBreakdown={true}
              />
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recent Chat Sessions */}
      <Row>
        <Col xs={24}>
          <Card
            title={
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <span className="text-sm sm:text-base">
                  Recent Chat Sessions
                </span>
                <Button
                  type="link"
                  onClick={() => navigate("/chats")}
                  icon={<RightOutlined />}
                  className="p-0 text-xs sm:text-sm"
                  size="small"
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
              <Empty description="No chat sessions yet"></Empty>
            )}
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <Row gutter={[12, 12]} className="justify-center sm:gutter-16">
          <Col xs={24} sm={12} md={8}>
            <Button
              type="primary"
              size="large"
              icon={<MessageOutlined />}
              onClick={() => navigate("/chats")}
              className="w-full h-16 sm:h-20 flex items-center justify-center text-sm sm:text-base"
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
