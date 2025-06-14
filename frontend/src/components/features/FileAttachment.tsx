import { useRef, useState } from "react";
import { Button, message, Typography, Tag } from "antd";
import {
  PaperClipOutlined,
  CloseOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileImageOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface FileAttachmentProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  maxSize?: number; // in MB
  className?: string;
}

function FileAttachment({
  onFileSelect,
  disabled = false,
  maxSize = 5,
  className = "",
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
    ".webp",
    ".svg",
    ".xls",
    ".xlsx",
    ".csv",
    ".ppt",
    ".pptx",
  ];

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    const iconSize = "text-base";

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
      case "csv":
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
      case "rtf":
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
          <FileTextOutlined
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
      CSV: "green",
      PPT: "orange",
      PPTX: "orange",
      TXT: "default",
      RTF: "default",
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
        className="text-xs font-medium border-0 px-1.5 py-0 m-0 leading-tight"
      >
        {extension}
      </Tag>
    );
  };

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
    <div className={`flex items-center gap-2 ${className}`}>
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
          title={`Attach file (max ${maxSize}MB)`}
          className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 
                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        />
      ) : (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
                        bg-blue-50 hover:bg-blue-100 border-blue-200 
                        dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800"
        >
          {/* File Icon */}
          <div
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md
                          bg-white border border-blue-200/50
                          dark:bg-blue-900/30 dark:border-blue-700/50"
          >
            {getFileIcon(selectedFile.name)}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Text
                className="text-xs font-medium truncate max-w-32 
                           text-blue-800 dark:text-blue-200"
                title={selectedFile.name}
              >
                {selectedFile.name}
              </Text>
              {getFileTypeTag(selectedFile.name)}
            </div>
            <Text className="text-xs text-blue-600 dark:text-blue-300">
              {formatFileSize(selectedFile.size)}
            </Text>
          </div>

          {/* Remove Button */}
          <Button
            icon={<CloseOutlined />}
            size="small"
            type="text"
            onClick={handleRemoveFile}
            disabled={disabled}
            className="flex-shrink-0 text-blue-500 hover:text-blue-700 hover:bg-blue-200/50
                       dark:text-blue-400 dark:hover:text-blue-200 dark:hover:bg-blue-800/50"
            title="Remove file"
          />
        </div>
      )}
    </div>
  );
}

export default FileAttachment;
