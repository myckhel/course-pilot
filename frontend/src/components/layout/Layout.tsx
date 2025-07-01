import { useState } from "react";
import { Layout as AntLayout, Drawer } from "antd";
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
      {/* Desktop Sidebar - Hidden on mobile */}
      {lg && <Sidebar collapsed={sidebarCollapsed} />}

      {/* Mobile Drawer Sidebar */}
      {!lg && (
        <Drawer
          title={null}
          placement="left"
          onClose={handleMobileMenuClose}
          open={mobileMenuVisible}
          styles={{
            body: { padding: 0 },
            header: { display: "none" },
          }}
          width={280}
          className="mobile-sidebar-drawer"
          maskClosable={true}
          closable={false}
        >
          <Sidebar
            collapsed={false}
            onClose={handleMobileMenuClose}
            isMobile={true}
          />
        </Drawer>
      )}

      {/* Main Content */}
      <AntLayout
        className={`transition-all duration-300 ease-in-out bg-gray-50 dark:bg-gray-900 ${
          lg ? "" : "ml-0"
        }`}
      >
        <Header onMenuToggle={handleMenuToggle} showMenuButton={true} />
        <Content className="p-3 sm:p-4 lg:p-6 min-h-[calc(100vh-64px)]">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default Layout;
