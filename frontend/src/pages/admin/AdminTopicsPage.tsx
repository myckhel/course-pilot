import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Modal,
  message,
  Popconfirm,
  Upload,
  Progress,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SearchOutlined,
  EyeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTopicsStore } from "@/stores";
import { topicsApi } from "@/apis";
import { formatDistanceToNow } from "@/utils";
import type { Topic } from "@/types";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";

const { Title } = Typography;
const { Search } = Input;

function AdminTopicsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const { topics, fetchTopics, deleteTopic } = useTopicsStore();

  useEffect(() => {
    const loadTopics = async () => {
      setLoading(true);
      try {
        await fetchTopics();
      } catch (error) {
        console.error("Failed to load topics:", error);
        message.error("Failed to load topics");
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, [fetchTopics]);

  const handleDeleteTopic = async (topicId: string) => {
    try {
      await deleteTopic(parseInt(topicId));
      message.success("Topic deleted successfully");
    } catch (error) {
      console.error("Failed to delete topic:", error);
      message.error("Failed to delete topic");
    }
  };

  const handleUploadDocuments = (topic: Topic) => {
    setSelectedTopic(topic);
    setUploadModalVisible(true);
    setFileList([]);
  };

  const handleUpload = async () => {
    if (!selectedTopic || fileList.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("file", file.originFileObj);
        }
      });

      await topicsApi.uploadDocument(selectedTopic.id, formData);
      message.success("Documents uploaded successfully");
      setUploadModalVisible(false);
      setFileList([]);
      setSelectedTopic(null);
      await fetchTopics(); // Refresh topics to get updated document counts
    } catch (error) {
      console.error("Failed to upload documents:", error);
      message.error("Failed to upload documents");
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "processing":
        return "orange";
      case "error":
        return "red";
      case "draft":
        return "blue";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "processing":
        return "Processing";
      case "error":
        return "Error";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  const filteredTopics = topics.filter((topic) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      topic.name.toLowerCase().includes(searchLower) ||
      topic.description.toLowerCase().includes(searchLower)
    );
  });

  const columns: ColumnsType<Topic> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: Topic) => (
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      filters: [
        { text: "Active", value: "active" },
        { text: "Processing", value: "processing" },
        { text: "Error", value: "error" },
        { text: "Draft", value: "draft" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Documents",
      dataIndex: "documentCount",
      key: "documentCount",
      render: (count: number, record: Topic) => (
        <div className="flex items-center space-x-2">
          <FileTextOutlined className="text-gray-400" />
          <span>{count}</span>
          {record.indexed_status === "processing" && count > 0 && (
            <Progress type="circle" size={20} percent={50} showInfo={false} />
          )}
        </div>
      ),
      sorter: (a, b) => a.document_count - b.document_count,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <span className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(date))}
        </span>
      ),
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: Topic) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/topics/${record.id}`)}
            title="View Details"
          />
          <Button
            type="text"
            icon={<UploadOutlined />}
            onClick={() => handleUploadDocuments(record)}
            title="Upload Documents"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/topics/${record.id}/edit`)}
            title="Edit Topic"
          />
          <Popconfirm
            title="Delete Topic"
            description="Are you sure you want to delete this topic? This action cannot be undone."
            onConfirm={() => handleDeleteTopic(record.id)}
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Delete Topic"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2}>Topics Management</Title>
          <span className="text-gray-500">
            Create and manage learning topics for students
          </span>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/admin/topics/new")}
        >
          Create Topic
        </Button>
      </div>

      {/* Search and Filters */}
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

      {/* Topics Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredTopics}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} topics`,
          }}
        />
      </Card>

      {/* Upload Documents Modal */}
      <Modal
        title={`Upload Documents - ${selectedTopic?.name}`}
        open={uploadModalVisible}
        onOk={handleUpload}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
          setSelectedTopic(null);
        }}
        confirmLoading={uploading}
        okText="Upload"
        okButtonProps={{ disabled: fileList.length === 0 }}
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Upload PDF documents to enhance the AI's knowledge about this topic.
            Supported formats: PDF
          </div>

          <Upload
            multiple
            accept=".pdf"
            fileList={fileList}
            onChange={({ fileList: newFileList }) => setFileList(newFileList)}
            beforeUpload={() => false} // Prevent auto upload
            className="w-full"
          >
            <Button icon={<UploadOutlined />} className="w-full">
              Select PDF Files
            </Button>
          </Upload>

          {fileList.length > 0 && (
            <div className="text-sm text-gray-500">
              {fileList.length} file(s) selected
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default AdminTopicsPage;
