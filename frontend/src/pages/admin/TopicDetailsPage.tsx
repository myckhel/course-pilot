import { useEffect, useState, useCallback } from "react";
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
  List,
  Empty,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

import { PageLoader } from "@/components/common";
import type { Topic, Document } from "@/types";
import { ADMIN_ROUTES } from "@/constants";
import { topicApi } from "../../apis/topics";
import { format } from "date-fns-tz";

const { Title, Text } = Typography;

function TopicDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const fetchTopicDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await topicApi.getTopicById(id!);
      setTopic(response.data);
    } catch (error) {
      console.error("Failed to fetch topic details:", error);
      message.error("Failed to fetch topic details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchDocuments = useCallback(async () => {
    try {
      setDocumentsLoading(true);
      const response = await topicApi.getTopicDocuments(id!);
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      message.error("Failed to fetch documents");
    } finally {
      setDocumentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchTopicDetails();
      fetchDocuments();
    }
  }, [id, fetchTopicDetails, fetchDocuments]);

  const handleEditTopic = () => {
    navigate(`${ADMIN_ROUTES.TOPICS}/edit/${id}`);
  };

  const handleDeleteTopic = async () => {
    try {
      await topicApi.deleteTopic(id!);
      message.success("Topic deleted successfully");
      navigate(ADMIN_ROUTES.TOPICS);
    } catch (error) {
      console.error("Failed to delete topic:", error);
      message.error("Failed to delete topic");
    }
  };

  const handleDeleteDocument = async (documentId: string, filename: string) => {
    try {
      await topicApi.deleteDocument(documentId);
      message.success(`Document "${filename}" deleted successfully`);
      // Refresh documents list and topic details
      await Promise.all([fetchDocuments(), fetchTopicDetails()]);
    } catch (error) {
      console.error("Failed to delete document:", error);
      message.error("Failed to delete document");
    }
  };

  const handleDownloadDocument = async (
    documentId: string,
    filename: string
  ) => {
    try {
      const response = await topicApi.downloadDocument(documentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download document:", error);
      message.error("Failed to download document");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
              fetchDocuments();
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

        {/* Documents Section */}
        <div className="lg:col-span-2">
          <Card
            title="Uploaded Documents"
            loading={documentsLoading}
            extra={
              <Text type="secondary">
                {documents.length} document{documents.length !== 1 ? "s" : ""}
              </Text>
            }
          >
            {documents.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    No documents uploaded yet.
                    <br />
                    <Text type="secondary">
                      Upload documents to enable Q&A functionality.
                    </Text>
                  </span>
                }
              />
            ) : (
              <List
                dataSource={documents}
                renderItem={(document) => (
                  <List.Item
                    actions={[
                      <Tooltip title="Download document">
                        <Button
                          type="text"
                          icon={<DownloadOutlined />}
                          onClick={() =>
                            handleDownloadDocument(
                              document.id,
                              document.filename
                            )
                          }
                        />
                      </Tooltip>,
                      <Popconfirm
                        title="Delete document"
                        description={`Are you sure you want to delete "${document.filename}"?`}
                        onConfirm={() =>
                          handleDeleteDocument(document.id, document.filename)
                        }
                        okText="Yes"
                        cancelText="No"
                      >
                        <Tooltip title="Delete document">
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                          />
                        </Tooltip>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <FileTextOutlined className="text-lg text-blue-500" />
                      }
                      title={
                        <div className="flex items-center gap-2">
                          <Text strong className="truncate">
                            {document.originalFilename}
                          </Text>
                          {document.size && (
                            <Tag color="blue" className="text-xs">
                              {formatFileSize(document.size)}
                            </Tag>
                          )}
                        </div>
                      }
                      description={
                        <div className="space-y-1">
                          <div className="flex gap-2 text-xs">
                            <Text type="secondary">
                              Uploaded:{" "}
                              {document.createdAt
                                ? format(
                                    new Date(document.createdAt),
                                    "yyyy-MM-dd HH:mm"
                                  )
                                : "-"}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TopicDetailsPage;
