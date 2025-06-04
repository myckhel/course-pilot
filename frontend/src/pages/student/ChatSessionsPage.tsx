import { useEffect, useState } from "react";
import {
  Card,
  List,
  Button,
  Typography,
  Empty,
  Spin,
  Input,
  Dropdown,
  Modal,
  Form,
} from "antd";
import {
  MessageOutlined,
  SearchOutlined,
  MoreOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "@/stores";
import { useDebounce } from "@/hooks";
import { formatDistanceToNow } from "@/utils";
import type { ChatSession } from "@/types";
import type { MenuProps } from "antd";

const { Title, Text } = Typography;
const { Search } = Input;
const { confirm } = Modal;

function ChatSessionsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);

  const { sessions, fetchSessions, deleteSession, createSession } =
    useChatStore();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [form] = Form.useForm();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchSessions();
      } catch (error) {
        console.error("Failed to load chat sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchSessions]);

  // Filter sessions based on search term
  const filteredSessions = sessions.filter((session) => {
    if (!debouncedSearchTerm) return true;
    const searchLower = debouncedSearchTerm.toLowerCase();
    return session.title?.toLowerCase().includes(searchLower);
  });

  const handleDeleteSession = (sessionId: string) => {
    confirm({
      title: "Delete Chat Session",
      content:
        "Are you sure you want to delete this chat session? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteSession(sessionId);
        } catch (error) {
          console.error("Failed to delete session:", error);
        }
      },
    });
  };

  const handleCreateNewChat = async (values: { title: string }) => {
    try {
      const newSession = await createSession({
        title: values.title,
      });

      setNewChatModalVisible(false);
      form.resetFields();
      navigate(`/chat/${newSession.id}`);
    } catch (error) {
      console.error("Failed to create new chat session:", error);
    }
  };

  const getSessionActions = (session: ChatSession): MenuProps["items"] => [
    {
      key: "continue",
      icon: <MessageOutlined />,
      label: "Continue Chat",
      onClick: () => navigate(`/chat/${session.id}`),
    },
    {
      key: "rename",
      icon: <EditOutlined />,
      label: "Rename",
      onClick: () => {
        // TODO: Implement rename functionality
      },
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Delete",
      danger: true,
      onClick: () => handleDeleteSession(session.id),
    },
  ];

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
      <div className="flex justify-between items-center px-4">
        <div>
          <Title level={2} className="!text-3xl !mb-0">
            Chat Sessions
          </Title>
          <Text type="secondary">
            Continue your conversations or start new ones
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setNewChatModalVisible(true)}
          className="px-6"
        >
          New Chat
        </Button>
      </div>

      {/* Search */}
      <Card className="px-4">
        <Search
          placeholder="Search chat sessions..."
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Sessions List */}
      <Card className="px-4">
        {filteredSessions.length > 0 ? (
          <List
            dataSource={filteredSessions}
            renderItem={(session: ChatSession) => (
              <List.Item
                onClick={() => navigate(`/chat/${session.id}`)}
                className="hover:bg-gray-50 dark:hover:bg-blue-100 rounded-lg transition-colors cursor-pointer group px-2 py-3 mb-2"
                style={{ marginBottom: 8 }}
                actions={[
                  <Dropdown
                    menu={{ items: getSessionActions(session) }}
                    placement="bottomRight"
                    key="actions"
                  >
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    />
                  </Dropdown>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <MessageOutlined className="text-blue-500 text-xl" />
                    </div>
                  }
                  title={
                    <span className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                      {session.title}
                    </span>
                  }
                  description={
                    <Text type="secondary" className="text-xs">
                      Last active{" "}
                      {formatDistanceToNow(new Date(session.updated_at))}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchTerm
                ? `No chat sessions found for "${searchTerm}"`
                : "No chat sessions yet"
            }
          >
            {!searchTerm && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setNewChatModalVisible(true)}
              >
                Start Your First Chat
              </Button>
            )}
          </Empty>
        )}
      </Card>

      {/* New Chat Modal */}
      <Modal
        title="Start New Chat"
        open={newChatModalVisible}
        onCancel={() => {
          setNewChatModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateNewChat}>
          <Form.Item
            name="title"
            label="Chat Title"
            rules={[
              { required: true, message: "Please enter a title for your chat" },
            ]}
          >
            <Input placeholder="e.g., GST Questions" />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Button type="primary" htmlType="submit">
              Start Chat
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ChatSessionsPage;
