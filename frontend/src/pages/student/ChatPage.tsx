import { useEffect, useState, useRef } from "react";
import {
  Card,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Space,
  Spin,
  Tag,
  Divider,
  Row,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  MessageOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useChatStore } from "@/stores";
import { formatDistanceToNow } from "@/utils";
import type { ChatMessage } from "@/types";

const { Text, Title } = Typography;
const { TextArea } = Input;

function ChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, fetchMessages, currentSession } =
    useChatStore();

  useEffect(() => {
    const initializeChat = async () => {
      setSessionLoading(true);
      try {
        await fetchMessages(sessionId as string);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        navigate("/chats");
      } finally {
        setSessionLoading(false);
      }
    };

    initializeChat();
  }, [sessionId, fetchMessages, navigate]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage("");
    setLoading(true);

    try {
      await sendMessage({
        sessionId: sessionId as string,
        message: userMessage,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Row className="mb-4">
        <Card className="w-full flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MessageOutlined className="text-blue-500" />
              </div>
              <div>
                <Title level={4} className="mb-0">
                  {currentSession?.title || "Chat Session"}
                </Title>
              </div>
            </div>
            <Tag color="green">Active</Tag>
          </div>
        </Card>
      </Row>

      {/* Messages */}
      <Card className="flex-grow flex flex-col min-h-0 border-none shadow-none bg-transparent">
        <div
          className="flex-grow overflow-y-auto px-2 md:px-6 py-4 space-y-2"
          style={{ maxHeight: "60vh" }}
        >
          {messages.length > 0 ? (
            <List
              dataSource={messages}
              renderItem={(msg: ChatMessage) => (
                <List.Item className="border-none px-0 bg-transparent">
                  <div
                    className={`w-full flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] flex items-end gap-2 md:gap-3 ${
                        msg.sender === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar
                        icon={
                          msg.sender === "user" ? (
                            <UserOutlined />
                          ) : (
                            <RobotOutlined />
                          )
                        }
                        className={
                          msg.sender === "user"
                            ? "bg-blue-500 shadow-md"
                            : "bg-green-500 shadow-md"
                        }
                        size={40}
                        style={{ flexShrink: 0 }}
                      />
                      <div
                        className={`relative px-4 py-2 rounded-2xl shadow-md text-base whitespace-pre-wrap break-words ${
                          msg.sender === "user"
                            ? "bg-blue-500 text-white rounded-br-md ml-2 md:ml-4 chat-bubble-user"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md mr-2 md:mr-4 chat-bubble-ai"
                        }`}
                        style={{
                          borderBottomRightRadius:
                            msg.sender === "user" ? 8 : 24,
                          borderBottomLeftRadius:
                            msg.sender === "user" ? 24 : 8,
                        }}
                      >
                        <div>{msg.message}</div>
                        <div
                          className={`text-xs mt-1 flex items-center gap-1 ${
                            msg.sender === "user"
                              ? "text-blue-100/80 justify-end"
                              : "text-gray-500 dark:text-gray-400 justify-start"
                          }`}
                        >
                          <ClockCircleOutlined />
                          {formatDistanceToNow(new Date(msg.timestamp))}
                        </div>
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <RobotOutlined className="text-4xl text-gray-400 mb-4" />
              <Title level={4} type="secondary">
                Start a conversation
              </Title>
              <Text type="secondary">Ask me anything!</Text>
            </div>
          )}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="flex items-end gap-2 md:gap-3">
                <Avatar
                  icon={<RobotOutlined />}
                  className="bg-green-500 shadow-md"
                  size={40}
                  style={{ flexShrink: 0 }}
                />
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2 shadow-md flex items-center gap-2">
                  <Spin size="small" />
                  <Text className="text-gray-600 dark:text-gray-300">
                    AI is thinking...
                  </Text>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <Divider className="my-4" />

        {/* Message Input */}
        <div className="flex-shrink-0">
          <Space.Compact className="w-full">
            <TextArea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={loading}
              className="flex-grow"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              disabled={!message.trim() || loading}
              className="h-auto"
            >
              Send
            </Button>
          </Space.Compact>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ChatPage;
