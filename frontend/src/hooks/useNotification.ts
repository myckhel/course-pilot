import { useCallback } from "react";
import { useUIStore } from "@/stores";

export function useNotification() {
  const { addNotification, removeNotification, clearNotifications } =
    useUIStore();

  const notify = {
    success: useCallback(
      (title: string, message?: string, duration?: number) => {
        addNotification({
          type: "success",
          title,
          message,
          duration,
        });
      },
      [addNotification]
    ),

    error: useCallback(
      (title: string, message?: string, duration?: number) => {
        addNotification({
          type: "error",
          title,
          message,
          duration: duration || 6000, // Longer duration for errors
        });
      },
      [addNotification]
    ),

    info: useCallback(
      (title: string, message?: string, duration?: number) => {
        addNotification({
          type: "info",
          title,
          message,
          duration,
        });
      },
      [addNotification]
    ),

    warning: useCallback(
      (title: string, message?: string, duration?: number) => {
        addNotification({
          type: "warning",
          title,
          message,
          duration: duration || 5000,
        });
      },
      [addNotification]
    ),
  };

  return {
    notify,
    removeNotification,
    clearNotifications,
  };
}
