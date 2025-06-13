import { Card, Row, Col, Progress, Typography, Spin } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { NPSData } from "@/types";

const { Title, Text } = Typography;

interface NPSChartProps {
  data: NPSData | null;
  loading?: boolean;
  title?: string;
  showDailyBreakdown?: boolean;
}

function NPSChart({
  data,
  loading = false,
  title = "Net Promoter Score (NPS)",
  showDailyBreakdown = true,
}: NPSChartProps) {
  if (loading) {
    return (
      <Card title={title}>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data || data.total_responses === 0) {
    return (
      <Card title={title}>
        <div className="text-center py-8">
          <Text type="secondary">
            No rating data available. Start rating AI responses to see your NPS
            score!
          </Text>
        </div>
      </Card>
    );
  }

  // Determine NPS score interpretation
  const getNPSInterpretation = (score: number) => {
    if (score >= 70)
      return { text: "Excellent", color: "#52c41a", icon: <TrophyOutlined /> };
    if (score >= 50)
      return { text: "Great", color: "#1890ff", icon: <SmileOutlined /> };
    if (score >= 30)
      return { text: "Good", color: "#722ed1", icon: <SmileOutlined /> };
    if (score >= 0)
      return { text: "Fair", color: "#fa8c16", icon: <MehOutlined /> };
    return {
      text: "Needs Improvement",
      color: "#ff4d4f",
      icon: <FrownOutlined />,
    };
  };

  const npsInterpretation = getNPSInterpretation(data.nps_score);

  // Data for pie chart
  const pieData = [
    {
      name: "Promoters",
      value: data.promoters,
      percentage: data.promoter_percentage,
      color: "#52c41a",
    },
    {
      name: "Passives",
      value: data.passives,
      percentage: data.passive_percentage,
      color: "#faad14",
    },
    {
      name: "Detractors",
      value: data.detractors,
      percentage: data.detractor_percentage,
      color: "#ff4d4f",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main NPS Score Card */}
      <Card className="my-2" title={title}>
        <Row gutter={[24, 24]} align="middle">
          {/* NPS Score Display */}
          <Col xs={24} md={8}>
            <div className="text-center">
              <div className="mb-4">
                <Text
                  className="text-6xl font-bold"
                  style={{ color: npsInterpretation.color }}
                >
                  {data.nps_score}
                </Text>
                <div className="text-base text-gray-500 mt-2">NPS Score</div>
              </div>
              <div className="flex items-center justify-center space-x-2 mb-2">
                {npsInterpretation.icon}
                <Text strong style={{ color: npsInterpretation.color }}>
                  {npsInterpretation.text}
                </Text>
              </div>
              <Text type="secondary">
                Based on {data.total_responses} responses
              </Text>
            </div>
          </Col>

          {/* Breakdown Statistics */}
          <Col xs={24} md={8}>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Text>Promoters (Positive)</Text>
                  <Text strong style={{ color: "#52c41a" }}>
                    {data.promoters} ({data.promoter_percentage.toFixed(1)}%)
                  </Text>
                </div>
                <Progress
                  percent={data.promoter_percentage}
                  strokeColor="#52c41a"
                  showInfo={false}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Text>Passives (No rating)</Text>
                  <Text strong style={{ color: "#faad14" }}>
                    {data.passives} ({data.passive_percentage.toFixed(1)}%)
                  </Text>
                </div>
                <Progress
                  percent={data.passive_percentage}
                  strokeColor="#faad14"
                  showInfo={false}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Text>Detractors (Negative)</Text>
                  <Text strong style={{ color: "#ff4d4f" }}>
                    {data.detractors} ({data.detractor_percentage.toFixed(1)}
                    %)
                  </Text>
                </div>
                <Progress
                  percent={data.detractor_percentage}
                  strokeColor="#ff4d4f"
                  showInfo={false}
                />
              </div>
            </div>
          </Col>

          {/* Pie Chart */}
          <Col xs={24} md={8}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData.filter((item) => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percentage }) =>
                    `${name}: ${percentage.toFixed(1)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Responses"]} />
              </PieChart>
            </ResponsiveContainer>
          </Col>
        </Row>
      </Card>

      {/* Daily Breakdown Chart */}
      {showDailyBreakdown &&
        data.daily_breakdown &&
        data.daily_breakdown.length > 0 && (
          <Card className="my-2" title="NPS Trend Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.daily_breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString()
                  }
                />
                <YAxis domain={[-100, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) =>
                    `Date: ${new Date(value).toLocaleDateString()}`
                  }
                  formatter={(value: number) => [
                    `${value.toFixed(1)}`,
                    "NPS Score",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="nps_score"
                  stroke="#1890ff"
                  strokeWidth={3}
                  dot={{ fill: "#1890ff", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 text-center">
              <Text type="secondary">
                NPS Score range: -100 (all detractors) to +100 (all promoters)
              </Text>
            </div>
          </Card>
        )}

      {/* NPS Explanation */}
      <Card className="my-2" title="Understanding Your NPS Score">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div className="text-center p-4 border rounded-lg">
              <SmileOutlined className="text-3xl text-green-500 mb-2" />
              <Title level={5}>Promoters</Title>
              <Text type="secondary">
                Students who rated responses positively. They're satisfied with
                the AI assistance.
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="text-center p-4 border rounded-lg">
              <MehOutlined className="text-3xl text-yellow-500 mb-2" />
              <Title level={5}>Passives</Title>
              <Text type="secondary">
                Responses that haven't been rated yet. These don't impact the
                NPS calculation.
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="text-center p-4 border rounded-lg">
              <FrownOutlined className="text-3xl text-red-500 mb-2" />
              <Title level={5}>Detractors</Title>
              <Text type="secondary">
                Students who rated responses negatively. Areas for improvement
                in AI assistance.
              </Text>
            </div>
          </Col>
        </Row>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Text>
            <strong>NPS Formula:</strong> % Promoters - % Detractors = NPS Score
            <br />
            Your score helps us understand how well our AI assistant is helping
            with your studies.
          </Text>
        </div>
      </Card>
    </div>
  );
}

export default NPSChart;
