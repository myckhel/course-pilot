import { Typography, Tag } from "antd";
import { FileTextOutlined, PaperClipOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface MessageAttachmentProps {
  attachment: {
    filename: string;
    size: number;
  };
  className?: string;
}

function MessageAttachment({
  attachment,
  className = "",
}: MessageAttachmentProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();

    // You can add more specific icons based on file type
    switch (extension) {
      case "pdf":
        return <FileTextOutlined className="text-red-500" />;
      case "doc":
      case "docx":
        return <FileTextOutlined className="text-blue-500" />;
      case "xls":
      case "xlsx":
        return <FileTextOutlined className="text-green-500" />;
      case "ppt":
      case "pptx":
        return <FileTextOutlined className="text-orange-500" />;
      case "txt":
        return <FileTextOutlined className="text-gray-500" />;
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "bmp":
        return <FileTextOutlined className="text-purple-500" />;
      default:
        return <PaperClipOutlined className="text-gray-500" />;
    }
  };

  return (
    <div className={`flex items-center gap-2 mt-2 ${className}`}>
      <Tag
        icon={getFileIcon(attachment.filename)}
        className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
      >
        <div className="flex flex-col min-w-0">
          <Text
            className="text-xs truncate max-w-40"
            title={attachment.filename}
          >
            {attachment.filename}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(attachment.size)}
          </Text>
        </div>
      </Tag>
    </div>
  );
}

export default MessageAttachment;
