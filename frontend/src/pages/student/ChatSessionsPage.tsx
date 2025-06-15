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
  Row,
  message,
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
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<ChatSession | null>(
    null
  );

  const {
    sessions,
    fetchSessions,
    deleteSession,
    createSession,
    updateSessionTitle,
  } = useChatStore();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [form] = Form.useForm();
  const [renameForm] = Form.useForm();

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
          message.success("Chat session deleted successfully");
        } catch (error) {
          console.error("Failed to delete session:", error);
          message.error("Failed to delete chat session. Please try again.");
        }
      },
    });
  };

  const handleCreateNewChat = async (values: { title: string }) => {
    try {
      const newSession = await createSession({
        title: values.title,
      });

      message.success("New chat session created successfully");
      setNewChatModalVisible(false);
      form.resetFields();
      navigate(`/chat/${newSession.id}`);
    } catch (error) {
      console.error("Failed to create new chat session:", error);
      message.error("Failed to create new chat session. Please try again.");
    }
  };

  const handleRenameSession = (session: ChatSession) => {
    setSessionToRename(session);
    setRenameModalVisible(true);
    renameForm.setFieldsValue({ title: session.title });
  };

  const handleRenameSubmit = async (values: { title: string }) => {
    if (!sessionToRename) return;

    try {
      await updateSessionTitle(sessionToRename.id, values.title);
      message.success("Chat session renamed successfully");
      setRenameModalVisible(false);
      setSessionToRename(null);
      renameForm.resetFields();
    } catch (error) {
      console.error("Failed to rename session:", error);
      message.error("Failed to rename chat session. Please try again.");
    }
  };

  const getSessionActions = (session: ChatSession): MenuProps["items"] => [
    {
      key: "continue",
      icon: <MessageOutlined />,
      label: "Continue Chat",
      onClick: (e) => {
        e?.domEvent?.stopPropagation();
        navigate(`/chat/${session.id}`);
      },
    },
    {
      key: "rename",
      icon: <EditOutlined />,
      label: "Rename",
      onClick: (e) => {
        e?.domEvent?.stopPropagation();
        handleRenameSession(session);
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
      onClick: (e) => {
        e?.domEvent?.stopPropagation();
        handleDeleteSession(session.id);
      },
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
      <Row>
        <Card className="px-4 w-full">
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
      </Row>

      {/* Sessions List */}
      <Card className="px-4">
        {filteredSessions.length > 0 ? (
          <List
            dataSource={filteredSessions}
            renderItem={(session: ChatSession) => (
              <List.Item
                onClick={() => navigate(`/chat/${session.id}`)}
                className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-lg dark:hover:shadow-xl rounded-xl transition-all duration-200 cursor-pointer group px-6 py-6 mb-3 border border-transparent hover:border-blue-200 dark:hover:border-blue-700/50"
                style={{ marginBottom: 16 }}
                actions={[
                  <div
                    key="actions"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <Dropdown
                      menu={{
                        items: getSessionActions(session),
                        onClick: (e) => e.domEvent?.stopPropagation(),
                      }}
                      placement="bottomRight"
                      trigger={["click"]}
                    >
                      <Button
                        type="text"
                        icon={<MoreOutlined />}
                        className="opacity-0 group-hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-all duration-200"
                      />
                    </Dropdown>
                  </div>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 rounded-xl transition-all duration-200 group-hover:scale-105 ml-3 shadow-sm group-hover:shadow-md">
                      <MessageOutlined className="text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-2xl transition-colors duration-200" />
                    </div>
                  }
                  title={
                    <div className="flex pt-3 self-center items-center">
                      <span className="font-semibold text-2xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 leading-tight">
                        {session.title}
                      </span>
                    </div>
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

      {/* Rename Modal */}
      <Modal
        title="Rename Chat Session"
        open={renameModalVisible}
        onCancel={() => {
          setRenameModalVisible(false);
          setSessionToRename(null);
          renameForm.resetFields();
        }}
        footer={null}
      >
        <Form form={renameForm} layout="vertical" onFinish={handleRenameSubmit}>
          <Form.Item
            name="title"
            label="Chat Title"
            rules={[
              { required: true, message: "Please enter a title for your chat" },
              { min: 1, message: "Title cannot be empty" },
            ]}
          >
            <Input placeholder="Enter new chat title" />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end space-x-2">
            <Button
              onClick={() => {
                setRenameModalVisible(false);
                setSessionToRename(null);
                renameForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Rename
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ChatSessionsPage;
