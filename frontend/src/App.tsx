import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { ConfigProvider, App as AntdApp } from "antd";
import { router } from "./router";
import { useUIStore } from "@/stores";
import { NotificationProvider } from "@/components/common";

function App() {
  const { theme } = useUIStore();

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === "dark" ? undefined : undefined, // We'll handle this later
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>
        <div className={`app ${theme}`}>
          <NotificationProvider />
          <RouterProvider router={router} />
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
