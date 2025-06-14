import { useRef, useState } from "react";
import { Button, message, Typography } from "antd";
import {
  PaperClipOutlined,
  CloseOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface FileAttachmentProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  maxSize?: number; // in MB
}

function FileAttachment({
  onFileSelect,
  disabled = false,
  maxSize = 5,
}: FileAttachmentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".rtf",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".xls",
    ".xlsx",
    ".csv",
    ".ppt",
    ".pptx",
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      message.error(
        `File type not supported. Allowed types: ${allowedTypes.join(", ")}`
      );
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      message.error(`File too large. Maximum size: ${maxSize}MB`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(",")}
        onChange={handleFileSelect}
        style={{ display: "none" }}
        disabled={disabled}
      />

      {!selectedFile ? (
        <Button
          icon={<PaperClipOutlined />}
          onClick={handleButtonClick}
          disabled={disabled}
          size="small"
          type="text"
          title="Attach file (max 5MB)"
          className="text-gray-500 hover:text-blue-500"
        />
      ) : (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800">
          <FileTextOutlined className="text-blue-500" />
          <div className="flex flex-col min-w-0">
            <Text
              className="text-xs truncate max-w-32"
              title={selectedFile.name}
            >
              {selectedFile.name}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatFileSize(selectedFile.size)}
            </Text>
          </div>
          <Button
            icon={<CloseOutlined />}
            size="small"
            type="text"
            onClick={handleRemoveFile}
            disabled={disabled}
            className="flex-shrink-0"
          />
        </div>
      )}
    </div>
  );
}

export default FileAttachment;
