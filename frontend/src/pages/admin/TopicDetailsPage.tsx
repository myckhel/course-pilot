import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  Alert,
  Divider,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import { PageLoader } from "@/components/common";
import type { Topic } from "@/types";
import { ADMIN_ROUTES } from "@/constants";
import { topicApi } from "../../apis/topics";

const { Title, Text } = Typography;

function TopicDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTopicDetails();
    }
  }, [id]);

  const fetchTopicDetails = async () => {
    try {
      setLoading(true);
      const response = await topicApi.getTopicById(id!);
      setTopic(response.data);
    } catch (error) {
      message.error("Failed to fetch topic details");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTopic = () => {
    navigate(`${ADMIN_ROUTES.TOPICS}/edit/${id}`);
  };

  const handleDeleteTopic = async () => {
    try {
      await topicApi.deleteTopic(id!);
      message.success("Topic deleted successfully");
      navigate(ADMIN_ROUTES.TOPICS);
    } catch (error) {
      message.error("Failed to delete topic");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "inactive":
        return "red";
      case "draft":
        return "orange";
      default:
        return "default";
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!topic) {
    return (
      <div className="p-6">
        <Alert
          message="Topic Not Found"
          description="The requested topic could not be found."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Title level={2}>{topic.name}</Title>
          <Text type="secondary">{topic.description}</Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchTopicDetails();
            }}
          >
            Refresh
          </Button>
          <Button icon={<EditOutlined />} onClick={handleEditTopic}>
            Edit Topic
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this topic?"
            description="This action cannot be undone and will delete all associated documents."
            onConfirm={handleDeleteTopic}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete Topic
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Information */}
        <div className="lg:col-span-1">
          <Card title="Topic Information">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">{topic.name}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(topic.status)}>{topic.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(topic.createdAt).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Updated">
                {new Date(topic.updatedAt).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Documents">
                {topic.documentCount} files
              </Descriptions.Item>
            </Descriptions>

            {topic.description && (
              <>
                <Divider />
                <div>
                  <Text strong>Description</Text>
                  <div className="mt-2">
                    <Text>{topic.description}</Text>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TopicDetailsPage;
