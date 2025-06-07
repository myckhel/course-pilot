import { useState } from "react";
import { Layout as AntLayout } from "antd";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useBreakpoint } from "@/hooks";

const { Content } = AntLayout;

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const { lg } = useBreakpoint();

  const handleMenuToggle = () => {
    if (lg) {
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      setMobileMenuVisible(!mobileMenuVisible);
    }
  };

  const handleMobileMenuClose = () => {
    setMobileMenuVisible(false);
  };

  return (
    <AntLayout className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Mobile Sidebar and Overlay */}
      {!lg && mobileMenuVisible && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out"
            onClick={handleMobileMenuClose}
          />
          <Sidebar
            collapsed={false}
            onClose={handleMobileMenuClose}
            isMobile={true}
          />
        </>
      )}

      {/* Main Content */}
      <AntLayout
        className={`transition-all duration-300 ease-in-out bg-gray-50 dark:bg-gray-900 ${
          lg ? (sidebarCollapsed ? "" : "") : "ml-0"
        }`}
      >
        <Header onMenuToggle={handleMenuToggle} showMenuButton={true} />
        <Content className="p-4 lg:p-6 min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto bg-transparent">
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default Layout;
