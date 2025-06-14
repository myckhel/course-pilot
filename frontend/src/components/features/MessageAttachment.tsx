import { Typography, Tag } from "antd";
import {
  FileTextOutlined,
  PaperClipOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileImageOutlined,
} from "@ant-design/icons";

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
    const iconSize = "text-lg";

    switch (extension) {
      case "pdf":
        return (
          <FilePdfOutlined
            className={`${iconSize} text-red-500 dark:text-red-400`}
          />
        );
      case "doc":
      case "docx":
        return (
          <FileWordOutlined
            className={`${iconSize} text-blue-500 dark:text-blue-400`}
          />
        );
      case "xls":
      case "xlsx":
        return (
          <FileExcelOutlined
            className={`${iconSize} text-green-500 dark:text-green-400`}
          />
        );
      case "ppt":
      case "pptx":
        return (
          <FilePptOutlined
            className={`${iconSize} text-orange-500 dark:text-orange-400`}
          />
        );
      case "txt":
        return (
          <FileTextOutlined
            className={`${iconSize} text-gray-600 dark:text-gray-400`}
          />
        );
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "bmp":
      case "webp":
      case "svg":
        return (
          <FileImageOutlined
            className={`${iconSize} text-purple-500 dark:text-purple-400`}
          />
        );
      default:
        return (
          <PaperClipOutlined
            className={`${iconSize} text-gray-600 dark:text-gray-400`}
          />
        );
    }
  };

  const getFileTypeTag = (filename: string) => {
    const extension = filename.split(".").pop()?.toUpperCase();
    if (!extension) return null;

    const tagColors: Record<string, string> = {
      PDF: "red",
      DOC: "blue",
      DOCX: "blue",
      XLS: "green",
      XLSX: "green",
      PPT: "orange",
      PPTX: "orange",
      TXT: "default",
      PNG: "purple",
      JPG: "purple",
      JPEG: "purple",
      GIF: "purple",
      BMP: "purple",
      WEBP: "purple",
      SVG: "purple",
    };

    return (
      <Tag
        color={tagColors[extension] || "default"}
        className="text-xs font-medium border-0 px-2 py-0.5 m-0"
      >
        {extension}
      </Tag>
    );
  };

  return (
    <div className={`w-full mt-3 ${className}`}>
      <div
        className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm
                      bg-gray-50 hover:bg-gray-100 border-gray-200 
                      dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
      >
        {/* File Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg
                        bg-white border border-gray-200
                        dark:bg-gray-700 dark:border-gray-600"
        >
          {getFileIcon(attachment.filename)}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Text
              className="text-sm font-medium truncate max-w-48 
                         text-gray-900 dark:text-gray-100"
              title={attachment.filename}
            >
              {attachment.filename}
            </Text>
            {getFileTypeTag(attachment.filename)}
          </div>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(attachment.size)}
          </Text>
        </div>
      </div>
    </div>
  );
}

export default MessageAttachment;
