import { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  message,
  Select,
} from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { topicsApi } from "@/apis";
import type { Topic, CreateTopicRequest } from "@/types";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TopicFormProps {
  topic?: Topic;
  isEdit?: boolean;
}

function TopicForm({ topic, isEdit = false }: TopicFormProps) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: CreateTopicRequest) => {
    setLoading(true);
    try {
      if (isEdit && topic) {
        await topicsApi.update(topic.id, values);
        message.success("Topic updated successfully");
      } else {
        await topicsApi.create(values);
        message.success("Topic created successfully");
      }
      navigate("/admin/topics");
    } catch (error) {
      console.error("Failed to save topic:", error);
      message.error(`Failed to ${isEdit ? "update" : "create"} topic`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/admin/topics")}
        >
          Back to Topics
        </Button>
        <Title level={2} className="mb-0">
          {isEdit ? "Edit Topic" : "Create New Topic"}
        </Title>
      </div>

      {/* Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={
            topic
              ? {
                  title: topic.name,
                  description: topic.description,
                  status: topic.status,
                }
              : {
                  status: "draft",
                }
          }
          className="max-w-2xl"
        >
          <Form.Item
            name="name"
            label="Title"
            rules={[
              { required: true, message: "Please enter a topic title" },
              { min: 3, message: "Title must be at least 3 characters long" },
              { max: 100, message: "Title must not exceed 100 characters" },
            ]}
          >
            <Input
              placeholder="Enter topic title (e.g., Introduction to Machine Learning)"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please enter a topic description" },
              {
                min: 10,
                message: "Description must be at least 10 characters long",
              },
              {
                max: 500,
                message: "Description must not exceed 500 characters",
              },
            ]}
          >
            <TextArea
              placeholder="Describe what this topic covers and what students will learn..."
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select size="large" placeholder="Select topic status">
              <Option value="draft">Draft</Option>
              <Option value="active">Active</Option>
              <Option value="processing">Processing</Option>
              <Option value="error">Error</Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                {isEdit ? "Update Topic" : "Create Topic"}
              </Button>
              <Button onClick={() => navigate("/admin/topics")} size="large">
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Title level={5} className="text-blue-700 dark:text-blue-300 mb-2">
            💡 Tips for Creating Effective Topics
          </Title>
          <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
            <li>
              • Use clear, descriptive titles that students can easily
              understand
            </li>
            <li>
              • Provide comprehensive descriptions that outline learning
              objectives
            </li>
            <li>
              • Start with "Draft" status and activate after uploading documents
            </li>
            <li>• Upload relevant PDF materials after creating the topic</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

export default TopicForm;
