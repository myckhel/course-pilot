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
      {lg && <Sidebar collapsed={sidebarCollapsed} />}

      {/* Mobile Sidebar */}
      {!lg && mobileMenuVisible && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleMobileMenuClose}
          />
          <Sidebar
            collapsed={false}
            onClose={handleMobileMenuClose}
            isMobile={true}
          />
        </>
      )}

      <AntLayout>
        <Header onMenuToggle={handleMenuToggle} showMenuButton={!lg} />

        <Content className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default Layout;
