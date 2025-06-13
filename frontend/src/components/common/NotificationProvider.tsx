import { useEffect, useRef } from "react";
import { notification } from "antd";
import { useUIStore } from "@/stores";

function NotificationProvider() {
  const { notifications, removeNotification } = useUIStore();
  const [api, contextHolder] = notification.useNotification();
  const displayedNotifications = useRef<Set<string>>(new Set());

  useEffect(() => {
    notifications.forEach((notif) => {
      // Only show notifications that haven't been displayed yet
      if (!displayedNotifications.current.has(notif.id)) {
        displayedNotifications.current.add(notif.id);

        const key = notif.id;

        api[notif.type]({
          key,
          message: notif.title,
          description: notif.message,
          duration: notif.duration ? notif.duration / 1000 : 4.5, // Convert to seconds
          onClose: () => {
            displayedNotifications.current.delete(notif.id);
            removeNotification(notif.id);
          },
        });
      }
    });

    // Clean up references for notifications that are no longer in the store
    const currentIds = new Set(notifications.map((n) => n.id));
    displayedNotifications.current.forEach((id) => {
      if (!currentIds.has(id)) {
        displayedNotifications.current.delete(id);
      }
    });
  }, [notifications, api, removeNotification]);

  return <>{contextHolder}</>;
}

export default NotificationProvider;
