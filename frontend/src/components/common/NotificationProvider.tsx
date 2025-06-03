import { useEffect } from "react";
import { notification } from "antd";
import { useUIStore } from "@/stores";

function NotificationProvider() {
  const { notifications, removeNotification } = useUIStore();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    notifications.forEach((notif) => {
      const key = notif.id;

      api[notif.type]({
        key,
        message: notif.title,
        description: notif.message,
        duration: notif.duration ? notif.duration / 1000 : 4.5, // Convert to seconds
        onClose: () => removeNotification(notif.id),
      });
    });
  }, [notifications, api, removeNotification]);

  return <>{contextHolder}</>;
}

export default NotificationProvider;
