import { useEffect, useState, useRef } from "react";
import {
  Card,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Spin,
  Divider,
  Row,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  MessageOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useChatStore } from "@/stores";
import RatingButtons from "@/components/features/RatingButtons";
import FileAttachment from "@/components/features/FileAttachment";
import MessageAttachment from "@/components/features/MessageAttachment";
import type { ChatMessage } from "@/types";
import { useNotification } from "@/hooks";

const { Text, Title } = Typography;
const { TextArea } = Input;

function ChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    fetchMessages,
    currentSession,
    updateMessageFeedback,
  } = useChatStore();

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

  // Cleanup effect for file attachments
  useEffect(() => {
    return () => {
      // Clean up any pending file attachments when component unmounts
      if (attachment) {
        setAttachment(null);
      }
    };
  }, [attachment]);

  const handleSendMessage = async () => {
    const userMessage = message.trim();

    // Validate message: must be at least 5 characters when no attachment
    if (userMessage.length < 5) {
      notify.error("Message must be at least 5 characters long");
      return;
    }

    // At least one of message or attachment must be present
    if (!userMessage && !attachment) {
      notify.error("Please enter both message and or attach a file");
      return;
    }

    if (loading) return;

    const attachmentFile = attachment;

    // Clear input immediately for better UX
    setMessage("");
    setAttachment(null);
    setLoading(true);

    try {
      await sendMessage({
        sessionId: sessionId as string,
        message: userMessage || "📎 File attachment",
        attachment: attachmentFile || undefined,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      notify.error("Failed to send message. Please try again.");

      // On error, restore the message but keep attachment cleared for safety
      // This prevents potential issues with stale file references
      setMessage(userMessage);
    } finally {
      setLoading(false);
      // Ensure attachment is always null after send attempt
      setAttachment(null);
    }
  };

  const handleRating = async (
    messageId: string,
    rating: "positive" | "negative" | null
  ) => {
    try {
      await updateMessageFeedback(messageId, rating);
    } catch (error) {
      console.error("Failed to update rating:", error);
    }
  };

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      notify.success("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      notify.error("Failed to copy text");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      const userMessage = message.trim();
      // Check validation before sending
      if (!attachment && userMessage.length < 5) {
        notify.error("Message must be at least 5 characters long");
        return;
      }

      if (!userMessage && !attachment) {
        notify.error("Please enter a message or attach a file");
        return;
      }

      handleSendMessage();
    } else if (e.key === "Escape" && attachment) {
      // Allow users to clear attachment with Escape key
      e.preventDefault();
      setAttachment(null);
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
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MessageOutlined className="text-blue-500 text-sm sm:text-base" />
              </div>
              <div>
                <Title level={4} className="mb-0 text-base sm:text-lg">
                  {currentSession?.title || "Chat Session"}
                </Title>
              </div>
            </div>
          </div>
        </Card>
      </Row>

      {/* Messages */}
      <Card className="flex-grow flex flex-col min-h-0 border-none shadow-none bg-transparent">
        <div
          className="flex-grow overflow-y-auto px-2 sm:px-4 md:px-6 py-4 space-y-2"
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
                      className={`max-w-[90%] sm:max-w-[80%] flex items-end gap-2 md:gap-3 ${
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
                        size={{ xs: 32, sm: 40 }}
                        style={{ flexShrink: 0 }}
                      />
                      <div
                        className={`relative ${
                          msg.sender === "user"
                            ? "flex flex-col items-end"
                            : "flex flex-col items-start"
                        }`}
                      >
                        <div
                          className={`px-3 sm:px-4 py-2 rounded-2xl shadow-md text-sm sm:text-base whitespace-pre-wrap break-words ${
                            msg.sender === "user"
                              ? "bg-blue-500 text-white rounded-br-md ml-1 sm:ml-2 md:ml-4 chat-bubble-user"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md mr-1 sm:mr-2 md:mr-4 chat-bubble-ai"
                          }`}
                          style={{
                            borderBottomRightRadius:
                              msg.sender === "user" ? 8 : 24,
                            borderBottomLeftRadius:
                              msg.sender === "user" ? 24 : 8,
                          }}
                        >
                          <div>{msg.message}</div>
                          {msg.attachment && (
                            <MessageAttachment
                              attachment={msg.attachment}
                              className="mt-2"
                            />
                          )}
                        </div>

                        {/* Rating buttons for AI messages */}
                        {msg.sender === "assistant" && (
                          <div className="mr-2 md:mr-4 mt-2 flex items-center space-x-2">
                            <RatingButtons
                              message={msg}
                              onRating={handleRating}
                              disabled={loading}
                            />
                            <Button
                              icon={<CopyOutlined />}
                              size="small"
                              onClick={() => handleCopy(msg.message)}
                              disabled={loading}
                              title="Copy message"
                            />
                          </div>
                        )}
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
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <TextArea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (minimum 5 characters)"
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={loading}
                className="text-sm sm:text-base"
                status={
                  !attachment && message.trim().length < 0 ? "error" : undefined
                }
              />
            </div>
            <div className="flex items-center gap-1">
              <FileAttachment
                onFileSelect={setAttachment}
                disabled={loading}
                selectedFile={attachment}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                size="large"
                className="h-auto min-h-[40px]"
                disabled={
                  loading ||
                  (!attachment && message.trim().length < 5) ||
                  (!message.trim() && !attachment)
                }
              >
                <span className="hidden sm:inline">Send</span>
                <span className="sm:hidden">Send</span>
              </Button>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="hidden sm:inline">
              Press Enter to send, Shift+Enter for new line
            </span>
            <span className="sm:hidden">Tap to send</span>
            {attachment && <span>, Esc to clear attachment</span>} • Message
            must be at least 5 characters • Max 5MB file size
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ChatPage;
