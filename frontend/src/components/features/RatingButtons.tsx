import { Button, Space, Tooltip } from "antd";
import {
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
} from "@ant-design/icons";
import type { ChatMessage } from "@/types";

interface RatingButtonsProps {
  message: ChatMessage;
  onRating: (
    messageId: string,
    rating: "positive" | "negative" | null
  ) => Promise<void>;
  disabled?: boolean;
}

function RatingButtons({
  message,
  onRating,
  disabled = false,
}: RatingButtonsProps) {
  const handlePositiveRating = async () => {
    const newRating = message.rating === "positive" ? null : "positive";
    await onRating(message.id, newRating);
  };

  const handleNegativeRating = async () => {
    const newRating = message.rating === "negative" ? null : "negative";
    await onRating(message.id, newRating);
  };

  return (
    <Space size="small" className="">
      <Tooltip
        title={
          message.rating === "positive"
            ? "Remove positive rating"
            : "Mark as helpful"
        }
      >
        <Button
          type="text"
          size="small"
          icon={
            message.rating === "positive" ? <LikeFilled /> : <LikeOutlined />
          }
          onClick={handlePositiveRating}
          disabled={disabled}
          className={`
            flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-900/20
            ${
              message.rating === "positive"
                ? "text-green-600 dark:text-green-400"
                : "text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
            }
          `}
        />
      </Tooltip>

      <Tooltip
        title={
          message.rating === "negative"
            ? "Remove negative rating"
            : "Mark as not helpful"
        }
      >
        <Button
          type="text"
          size="small"
          icon={
            message.rating === "negative" ? (
              <DislikeFilled />
            ) : (
              <DislikeOutlined />
            )
          }
          onClick={handleNegativeRating}
          disabled={disabled}
          className={`
            flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20
            ${
              message.rating === "negative"
                ? "text-red-600 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            }
          `}
        />
      </Tooltip>
    </Space>
  );
}

export default RatingButtons;
