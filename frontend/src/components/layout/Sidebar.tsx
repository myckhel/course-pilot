import { Layout, Menu, Button, Typography } from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  CloseOutlined,
  MessageOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, useUIStore } from "@/stores";
import { ROUTES } from "@/constants";
import type { MenuProps } from "antd";

const { Sider } = Layout;
const { Title } = Typography;

interface SidebarProps {
  collapsed: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

function Sidebar({ collapsed, onClose, isMobile = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme } = useUIStore();

  const isAdmin = user?.role === "admin";

  // Student menu items
  const studentMenuItems: MenuProps["items"] = [
    {
      key: ROUTES.DASHBOARD,
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => {
        navigate(ROUTES.DASHBOARD);
        if (isMobile && onClose) onClose();
      },
    },
    {
      key: "/chats",
      icon: <MessageOutlined />,
      label: "Chat Sessions",
      onClick: () => {
        navigate("/chats");
        if (isMobile && onClose) onClose();
      },
    },
    {
      type: "divider",
    },
    {
      key: "/profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => {
        navigate("/profile");
        if (isMobile && onClose) onClose();
      },
    },
  ];

  // Admin menu items
  const adminMenuItems: MenuProps["items"] = [
    {
      key: ROUTES.ADMIN_DASHBOARD,
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => {
        navigate(ROUTES.ADMIN_DASHBOARD);
        if (isMobile && onClose) onClose();
      },
    },
    {
      key: "/admin/topics",
      icon: <BookOutlined />,
      label: "Manage Topics",
      onClick: () => {
        navigate("/admin/topics");
        if (isMobile && onClose) onClose();
      },
    },
    // {
    //   key: "/admin/users",
    //   icon: <UsergroupAddOutlined />,
    //   label: "Users",
    //   onClick: () => {
    //     navigate("/admin/users");
    //     if (isMobile && onClose) onClose();
    //   },
    // },
    // {
    //   key: "/admin/analytics",
    //   icon: <BarChartOutlined />,
    //   label: "Analytics",
    //   onClick: () => {
    //     navigate("/admin/analytics");
    //     if (isMobile && onClose) onClose();
    //   },
    // },
    {
      type: "divider",
    },
    {
      key: "/profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => {
        navigate("/profile");
        if (isMobile && onClose) onClose();
      },
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : studentMenuItems;

  const selectedKey = location.pathname;

  return (
    <Sider
      collapsed={collapsed}
      collapsedWidth={isMobile ? 0 : 80}
      width={isMobile ? "100%" : 240}
      className={`
        ${isMobile ? "h-full" : "fixed h-screen"} 
        transition-all duration-300 ease-in-out
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        ${isMobile ? "" : "relative"}
      `}
      style={{
        backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
      }}
      trigger={null}
    >
      {/* Logo Section */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 relative">
        {isMobile && (
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            size="small"
          />
        )}
        <div className="flex justify-center items-center space-x-3 w-full">
          {!collapsed || isMobile ? (
            <Title level={4} className="m-0 text-gray-900 dark:text-white">
              GSTutor
            </Title>
          ) : (
            <Title level={4} className="m-0 text-gray-900 dark:text-white">
              GST
            </Title>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div
        className={`${
          isMobile ? "py-4 h-[calc(100vh-128px)] overflow-y-auto" : "py-4"
        }`}
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          className="border-none bg-transparent"
          theme={theme === "dark" ? "dark" : "light"}
          inlineCollapsed={collapsed && !isMobile}
        />
      </div>

      {/* Bottom Section - Only show on desktop or expanded mobile */}
      {(!isMobile || !collapsed) && (
        <div
          className={`${
            isMobile ? "absolute" : "absolute"
          } bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700`}
        >
          {/* You can add collapsed/expanded bottom content here */}
        </div>
      )}
    </Sider>
  );
}

export default Sidebar;
