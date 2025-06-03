import { useCallback } from "react";
import { useUIStore } from "@/stores";
import type { Notification } from "@/types";

export function useNotification() {
  const { addNotification, removeNotification, clearNotifications } =
    useUIStore();

  const notify = useCallback(
    {
      success: (title: string, message?: string, duration?: number) => {
        addNotification({
          type: "success",
          title,
          message,
          duration,
        });
      },

      error: (title: string, message?: string, duration?: number) => {
        addNotification({
          type: "error",
          title,
          message,
          duration: duration || 6000, // Longer duration for errors
        });
      },

      info: (title: string, message?: string, duration?: number) => {
        addNotification({
          type: "info",
          title,
          message,
          duration,
        });
      },

      warning: (title: string, message?: string, duration?: number) => {
        addNotification({
          type: "warning",
          title,
          message,
          duration: duration || 5000,
        });
      },
    },
    [addNotification]
  );

  return {
    notify,
    removeNotification,
    clearNotifications,
  };
}
