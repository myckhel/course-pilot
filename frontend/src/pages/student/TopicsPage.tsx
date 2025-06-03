import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Tag,
  Typography,
  Empty,
  Spin,
  Space,
  Pagination,
} from "antd";
import {
  BookOutlined,
  SearchOutlined,
  MessageOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTopicsStore } from "@/stores";
import { useDebounce } from "@/hooks";
import { formatDistanceToNow } from "@/utils";
import type { Topic } from "@/types";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

function TopicsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const { topics, fetchTopics } = useTopicsStore();
  // const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const pageSize = 12;

  useEffect(() => {
    const loadTopics = async () => {
      setLoading(true);
      try {
        await fetchTopics();
      } catch (error) {
        console.error("Failed to load topics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, [fetchTopics]);

  // Filter topics based on search term and status
  // const filteredTopics = topics.filter((topic) => {
  //   if (topic.status !== "active") return false;

  //   if (!debouncedSearchTerm) return true;

  //   const searchLower = debouncedSearchTerm.toLowerCase();
  //   return (
  //     topic.title.toLowerCase().includes(searchLower) ||
  //     topic.description.toLowerCase().includes(searchLower)
  //   );
  // });

  // Paginate topics
  // const startIndex = (currentPage - 1) * pageSize;
  // const paginatedTopics = filteredTopics.slice(
  //   startIndex,
  //   startIndex + pageSize
  // );
  // console.log({ paginatedTopics });

  const handleStartChat = (topicId: string) => {
    navigate(`/topics/${topicId}/chat`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "processing":
        return "orange";
      case "error":
        return "red";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Title level={2}>Available Topics</Title>
        <Text type="secondary">
          Choose a topic to start learning with AI assistance
        </Text>
      </div>

      {/* Search */}
      <Card>
        <Search
          placeholder="Search topics..."
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Topics Grid */}
      {topics.length > 0 ? (
        <div className="space-y-6">
          <Row gutter={[16, 16]}>
            {topics.map((topic: Topic) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={topic.id}>
                <Card
                  hoverable
                  className="h-full flex flex-col"
                  actions={[
                    <Button
                      type="primary"
                      icon={<MessageOutlined />}
                      onClick={() => handleStartChat(topic.id)}
                      key="start-chat"
                    >
                      Start Chat
                    </Button>,
                  ]}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <BookOutlined className="text-2xl text-blue-500" />
                      <Tag color={getStatusColor(topic.status)}>
                        {topic.status}
                      </Tag>
                    </div>

                    <Title level={4} className="mb-2 line-clamp-2">
                      {topic.name}
                    </Title>

                    <Paragraph
                      ellipsis={{ rows: 3, expandable: false }}
                      className="text-gray-600 dark:text-gray-300 flex-grow"
                    >
                      {topic.description}
                    </Paragraph>

                    <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Space className="w-full justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <FileTextOutlined className="mr-1" />
                          {topic.documentCount} docs
                        </div>
                        <Text type="secondary" className="text-xs">
                          {formatDistanceToNow(new Date(topic.createdAt))}
                        </Text>
                      </Space>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {topics.length > pageSize && (
            <div className="flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={topics.length}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} topics`
                }
              />
            </div>
          )}
        </div>
      ) : (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchTerm
                ? `No topics found for "${searchTerm}"`
                : "No topics available yet"
            }
          >
            {!searchTerm && (
              <Text type="secondary">
                Topics will appear here once they are created by administrators.
              </Text>
            )}
          </Empty>
        </Card>
      )}
    </div>
  );
}

export default TopicsPage;
