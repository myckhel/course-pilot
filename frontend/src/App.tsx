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
        algorithm:
          themeMode === "dark"
            ? [theme.darkAlgorithm, theme.compactAlgorithm]
            : [theme.defaultAlgorithm, theme.compactAlgorithm],
        token: {
          // Colors
          colorPrimary: "#1890ff",
          colorSuccess: "#22c55e",
          colorError: "#ef4444",
          colorWarning: "#f59e0b",
          colorInfo: "#1890ff",

          // Neutral colors - Dynamic based on theme
          colorText: themeMode === "dark" ? "#ffffff" : "#171717",
          colorTextSecondary: themeMode === "dark" ? "#a3a3a3" : "#525252",
          colorBgContainer: themeMode === "dark" ? "#1f2937" : "#ffffff",
          colorBgElevated: themeMode === "dark" ? "#374151" : "#fafafa",
          colorBgLayout: themeMode === "dark" ? "#111827" : "#f9fafb",
          colorBorder: themeMode === "dark" ? "#374151" : "#d1d5db",
          colorBorderSecondary: themeMode === "dark" ? "#4b5563" : "#e5e7eb",

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

          // Shadows - Adapted for dark mode
          boxShadow:
            themeMode === "dark"
              ? "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
          boxShadowSecondary:
            themeMode === "dark"
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)"
              : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",

          // Motion
          motionDurationFast: "0.1s",
          motionDurationMid: "0.2s",
          motionDurationSlow: "0.3s",
          motionEaseInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
          motionEaseOut: "cubic-bezier(0, 0, 0.2, 1)",

          // Component specific
          controlHeight: 36,
          controlHeightSM: 32,
          controlHeightLG: 42,

          // Opacity
          opacityImage: 1,
          opacityLoading: 0.65,

          // Z-index
          zIndexBase: 0,
          zIndexPopupBase: 1000,
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
            boxShadow:
              themeMode === "dark"
                ? "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)"
                : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
            colorBgContainer: themeMode === "dark" ? "#1f2937" : "#ffffff",
            colorText: themeMode === "dark" ? "#ffffff" : "#171717",
            colorTextSecondary: themeMode === "dark" ? "#a3a3a3" : "#525252",
            colorBorder: themeMode === "dark" ? "#374151" : "#d1d5db",
          },
          Modal: {
            borderRadius: 12,
            paddingContentHorizontal: 24,
          },
          Dropdown: {
            borderRadius: 8,
            controlHeight: 36,
          },
          Layout: {
            headerBg: themeMode === "dark" ? "#1f2937" : "#ffffff",
            bodyBg: themeMode === "dark" ? "#111827" : "#f9fafb",
            siderBg: themeMode === "dark" ? "#1f2937" : "#ffffff",
          },
          Menu: {
            itemBg: "transparent",
            itemSelectedBg:
              themeMode === "dark" ? "rgba(59, 130, 246, 0.1)" : "#e6f7ff",
            itemHoverBg:
              themeMode === "dark" ? "rgba(59, 130, 246, 0.05)" : "#f0f9ff",
            itemSelectedColor: "#1890ff",
            itemColor: themeMode === "dark" ? "#ffffff" : "#171717",
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
