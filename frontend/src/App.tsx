import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import { router } from "./router";
import { useUIStore } from "@/stores";
import { NotificationProvider } from "@/components/common";

function App() {
  const { theme: themeMode } = useUIStore();

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", themeMode === "dark");
  }, [themeMode]);

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === "dark" ? [theme.darkAlgorithm, theme.compactAlgorithm] : [theme.defaultAlgorithm, theme.compactAlgorithm],
        token: {
          // Colors
          colorPrimary: "#1890ff",
          colorSuccess: "#22c55e",
          colorError: "#ef4444",
          colorWarning: "#f59e0b",
          colorInfo: "#1890ff",
          
          // Neutral colors
          colorText: "#171717",
          colorTextSecondary: "#525252",
          colorBgContainer: "#ffffff",
          colorBgElevated: "#fafafa",
          
          // Border radius
          borderRadius: 6,
          borderRadiusSM: 4,
          borderRadiusLG: 8,
          borderRadiusXS: 2,
          
          // Spacing
          marginXS: 8,
          marginSM: 12,
          margin: 16,
          marginMD: 20,
          marginLG: 24,
          marginXL: 32,
          padding: 16,
          paddingSM: 12,
          paddingLG: 24,
          paddingXL: 32,
          
          // Typography
          fontSize: 16,
          fontSizeSM: 14,
          fontSizeLG: 18,
          fontSizeXL: 20,
          lineHeight: 1.5,
          lineHeightSM: 1.25,
          lineHeightLG: 1.75,
          
          // Shadows
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
          boxShadowSecondary: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
          
          // Motion
          motionDurationFast: "0.1s",
          motionDurationMid: "0.2s",
          motionDurationSlow: "0.3s",
          motionEaseInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
          motionEaseOut: "cubic-bezier(0, 0, 0.2, 1)",
          motionEaseIn: "cubic-bezier(0.4, 0, 1, 1)",
          
          // Component specific
          controlHeight: 36,
          controlHeightSM: 32,
          controlHeightLG: 42,
          
          // Opacity
          opacityImage: 1,
          opacityLoading: 0.65,
          
          // Z-index
          zIndexBase: 1000,
          zIndexPopup: 1050,
          zIndexModal: 1100,
        },
        components: {
          Button: {
            controlHeight: 36,
            paddingContentHorizontal: 16,
            borderRadius: 6,
          },
          Input: {
            controlHeight: 36,
            borderRadius: 6,
          },
          Select: {
            controlHeight: 36,
            borderRadius: 6,
          },
          Card: {
            borderRadius: 12,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
          },
          Modal: {
            borderRadius: 12,
            paddingContentHorizontal: 24,
          },
          Dropdown: {
            borderRadius: 8,
            controlHeight: 36,
          },
        },
      }}
    >
      <AntdApp>
        <div className={`app ${themeMode} arc-scrollbar`}>
          <NotificationProvider />
          <RouterProvider router={router} />
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
