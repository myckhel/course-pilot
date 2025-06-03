import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Typography, message } from "antd";

import { PageLoader } from "@/components/common";
import { TopicForm } from "@/components/features";
import type { Topic, TopicFormData } from "@/types";
import { ADMIN_ROUTES } from "@/constants";
import { topicApi } from "../../apis/topics";

const { Title } = Typography;

function EditTopicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTopic();
    }
  }, [id]);

  const fetchTopic = async () => {
    try {
      setLoading(true);
      const response = await topicApi.getTopicById(id!);
      setTopic(response.data);
    } catch (error) {
      message.error("Failed to fetch topic details");
      navigate(ADMIN_ROUTES.TOPICS);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: TopicFormData) => {
    try {
      await topicApi.updateTopic(id!, formData);
      message.success("Topic updated successfully");
      navigate(`${ADMIN_ROUTES.TOPICS}/${id}`);
    } catch (error) {
      message.error("Failed to update topic");
      throw error; // Re-throw to keep form in loading state
    }
  };

  const handleCancel = () => {
    navigate(`${ADMIN_ROUTES.TOPICS}/${id}`);
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!topic) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Title level={2}>Edit Topic</Title>

        <Card className="mt-6">
          <TopicForm
            topic={topic}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </Card>
      </div>
    </div>
  );
}

export default EditTopicPage;
