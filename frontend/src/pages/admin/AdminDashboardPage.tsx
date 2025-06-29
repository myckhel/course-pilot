import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  List,
  Typography,
  Spin,
  Progress,
} from "antd";
import {
  BookOutlined,
  UserOutlined,
  MessageOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/apis";
import { formatDistanceToNow } from "@/utils";
import type { AdminDashboardStats } from "@/types";

const { Title, Text } = Typography;

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardStats = async () => {
      setLoading(true);
      try {
        const data = await adminApi.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <div className="text-center">
          <Text type="secondary">Failed to load dashboard statistics</Text>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-6 text-white">
        <Title level={2} className="text-white mb-2">
          Admin Dashboard
        </Title>
        <Text className="text-purple-100 text-lg">
          Manage your AI tutoring platform and monitor system performance.
        </Text>
      </div>

      {/* Key Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Topics"
              value={stats.totalTopics}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Chat Sessions"
              value={stats.totalSessions}
              prefix={<MessageOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Documents"
              value={stats.totalDocuments}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Activity and Performance */}
      <Row gutter={[24, 24]}>
        {/* System Health */}
        <Col xs={24} lg={8}>
          <Card title="System Health" className="h-full">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Text>Processing Status</Text>
                  <Text strong>{stats.processingSuccess}%</Text>
                </div>
                <Progress
                  percent={stats.processingSuccess}
                  status={stats.processingSuccess > 90 ? "success" : "active"}
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#87d068",
                  }}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Text>Active Topics</Text>
                  <Text strong>
                    {stats.activeTopics}/{stats.totalTopics}
                  </Text>
                </div>
                <Progress
                  percent={(stats.activeTopics / stats.totalTopics) * 100}
                  status="success"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <Text type="secondary">System Status</Text>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <Text className="text-green-600">Healthy</Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Recent Topics */}
        <Col xs={24} lg={8}>
          <Card
            title="Recent Topics"
            extra={<a onClick={() => navigate("/admin/topics")}>View All</a>}
            className="h-full"
          >
            {stats.recentTopics && stats.recentTopics.length > 0 ? (
              <List
                dataSource={stats.recentTopics.slice(0, 5)}
                renderItem={(topic) => (
                  <List.Item className="px-0">
                    <List.Item.Meta
                      avatar={<BookOutlined className="text-blue-500" />}
                      title={
                        <div className="flex items-center justify-between">
                          <span className="truncate">{topic.title}</span>
                          <Text type="secondary" className="text-xs ml-2">
                            {topic.documentCount} docs
                          </Text>
                        </div>
                      }
                      description={
                        <Text type="secondary" className="text-xs">
                          {formatDistanceToNow(new Date(topic.createdAt))}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center py-8">
                <Text type="secondary">No topics yet</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* User Activity */}
        <Col xs={24} lg={8}>
          <Card title="User Activity" className="h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChartOutlined className="text-green-500" />
                  <Text>Active Users (24h)</Text>
                </div>
                <Text strong>{stats.activeUsers24h}</Text>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageOutlined className="text-blue-500" />
                  <Text>Messages Today</Text>
                </div>
                <Text strong>{stats.messagesToday}</Text>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClockCircleOutlined className="text-orange-500" />
                  <Text>Avg Session Time</Text>
                </div>
                <Text strong>{stats.avgSessionTime}m</Text>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <Text type="secondary" className="text-sm">
                  Peak hours: {stats.peakHours || "9 AM - 11 AM"}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      {/* <Card title="Quick Actions">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => navigate("/admin/topics/new")}
              className="text-center cursor-pointer"
            >
              <BookOutlined className="text-3xl text-blue-500 mb-2" />
              <Text strong>Create Topic</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => navigate("/admin/topics")}
              className="text-center cursor-pointer"
            >
              <FileTextOutlined className="text-3xl text-green-500 mb-2" />
              <Text strong>Manage Topics</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => navigate("/admin/users")}
              className="text-center cursor-pointer"
            >
              <UserOutlined className="text-3xl text-purple-500 mb-2" />
              <Text strong>User Management</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => navigate("/admin/analytics")}
              className="text-center cursor-pointer"
            >
              <BarChartOutlined className="text-3xl text-orange-500 mb-2" />
              <Text strong>Analytics</Text>
            </Card>
          </Col>
        </Row>
      </Card> */}
    </div>
  );
}

export default AdminDashboardPage;
