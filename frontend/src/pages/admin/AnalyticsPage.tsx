import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Typography,
  Table,
  Tag,
  Space,
  Button,
} from "antd";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  UserOutlined,
  MessageOutlined,
  BookOutlined,
  DownloadOutlined,
  ReloadOutlined,
  UpOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import { analyticsApi } from "@/apis/analyticsApi";
import type { AnalyticsData, TopicAnalytics, UserAnalytics } from "@/types";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function AnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [topicAnalytics, setTopicAnalytics] = useState<TopicAnalytics[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analytics, topics, users] = await Promise.all([
        analyticsApi.getOverviewAnalytics(timeRange),
        analyticsApi.getTopicAnalytics(timeRange),
        analyticsApi.getUserAnalytics(timeRange),
      ]);

      setAnalyticsData(analytics.data);
      setTopicAnalytics(topics.data);
      setUserAnalytics(users.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await analyticsApi.exportReport(timeRange);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `analytics-report-${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export report:", error);
    }
  };

  // Mock data for demonstration - replace with actual API data
  const mockChartData = [
    { date: "2024-01-01", messages: 45, users: 12, topics: 3 },
    { date: "2024-01-02", messages: 52, users: 15, topics: 4 },
    { date: "2024-01-03", messages: 48, users: 13, topics: 3 },
    { date: "2024-01-04", messages: 61, users: 18, topics: 5 },
    { date: "2024-01-05", messages: 55, users: 16, topics: 4 },
    { date: "2024-01-06", messages: 67, users: 20, topics: 6 },
    { date: "2024-01-07", messages: 72, users: 22, topics: 5 },
  ];

  const mockTopicData = [
    { name: "Mathematics", value: 35, color: "#8884d8" },
    { name: "Physics", value: 25, color: "#82ca9d" },
    { name: "Chemistry", value: 20, color: "#ffc658" },
    { name: "Biology", value: 15, color: "#ff7300" },
    { name: "Computer Science", value: 5, color: "#00ff00" },
  ];

  const topicColumns: ColumnsType<TopicAnalytics> = [
    {
      title: "Topic",
      dataIndex: "topic_name",
      key: "topic_name",
    },
    {
      title: "Total Questions",
      dataIndex: "total_questions",
      key: "total_questions",
      sorter: (a, b) => a.total_questions - b.total_questions,
    },
    {
      title: "Unique Users",
      dataIndex: "unique_users",
      key: "unique_users",
      sorter: (a, b) => a.unique_users - b.unique_users,
    },
    {
      title: "Avg Response Time",
      dataIndex: "avg_response_time",
      key: "avg_response_time",
      render: (time: number) => `${time.toFixed(2)}s`,
    },
    {
      title: "Satisfaction",
      dataIndex: "satisfaction_rate",
      key: "satisfaction_rate",
      render: (rate: number) => (
        <Tag color={rate >= 0.8 ? "green" : rate >= 0.6 ? "orange" : "red"}>
          {(rate * 100).toFixed(1)}%
        </Tag>
      ),
    },
  ];

  const userColumns: ColumnsType<UserAnalytics> = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Questions Asked",
      dataIndex: "questions_count",
      key: "questions_count",
      sorter: (a, b) => a.questions_count - b.questions_count,
    },
    {
      title: "Sessions",
      dataIndex: "sessions_count",
      key: "sessions_count",
      sorter: (a, b) => a.sessions_count - b.sessions_count,
    },
    {
      title: "Total Time",
      dataIndex: "total_time",
      key: "total_time",
      render: (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
      },
    },
    {
      title: "Last Active",
      dataIndex: "last_active",
      key: "last_active",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Analytics Dashboard</Title>
        <Space>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
          >
            <Option value="1d">Last Day</Option>
            <Option value="7d">Last Week</Option>
            <Option value="30d">Last Month</Option>
            <Option value="90d">Last Quarter</Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAnalytics}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportReport}
          >
            Export Report
          </Button>
        </Space>
      </div>

      {/* Overview Statistics */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Messages"
              value={analyticsData?.total_messages || 1247}
              prefix={<MessageOutlined />}
              suffix={
                <span className="text-green-500 text-sm">
                  <UpOutlined /> 12%
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={analyticsData?.active_users || 89}
              prefix={<UserOutlined />}
              suffix={
                <span className="text-green-500 text-sm">
                  <UpOutlined /> 8%
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Topics Accessed"
              value={analyticsData?.topics_accessed || 23}
              prefix={<BookOutlined />}
              suffix={
                <span className="text-red-500 text-sm">
                  <UpOutlined className="rotate-180" /> 3%
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Avg Response Time"
              value={analyticsData?.avg_response_time || 2.4}
              precision={1}
              suffix="s"
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={16} className="mb-6">
        <Col span={16}>
          <Card title="Activity Trends" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Messages"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Active Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Topic Distribution" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockTopicData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockTopicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Usage Patterns */}
      <Row gutter={16} className="mb-6">
        <Col span={24}>
          <Card title="Weekly Usage Pattern" loading={loading}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Detailed Analytics Tables */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Topic Performance" loading={loading}>
            <Table
              columns={topicColumns}
              dataSource={topicAnalytics}
              rowKey="topicId"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Most Active Users" loading={loading}>
            <Table
              columns={userColumns}
              dataSource={userAnalytics}
              rowKey="user_id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AnalyticsPage;
