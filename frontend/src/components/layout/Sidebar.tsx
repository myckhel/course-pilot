import { Layout, Menu, Button } from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  UsergroupAddOutlined,
  BarChartOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";
import type { MenuProps } from "antd";

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

function Sidebar({ collapsed, onClose, isMobile = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

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
      key: "/topics",
      icon: <BookOutlined />,
      label: "Topics",
      onClick: () => {
        navigate("/topics");
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
    {
      key: "/admin/users",
      icon: <UsergroupAddOutlined />,
      label: "Users",
      onClick: () => {
        navigate("/admin/users");
        if (isMobile && onClose) onClose();
      },
    },
    {
      key: "/admin/analytics",
      icon: <BarChartOutlined />,
      label: "Analytics",
      onClick: () => {
        navigate("/admin/analytics");
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
      width={240}
      className={`
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        ${isMobile ? "fixed inset-y-0 left-0 z-50" : ""}
      `}
      style={isMobile ? { height: "100vh" } : undefined}
    >
      {/* Mobile close button */}
      {isMobile && (
        <div className="flex justify-end p-4">
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="text-gray-600 dark:text-gray-300"
          />
        </div>
      )}

      <div className="py-4">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          className="bg-transparent border-none"
        />
      </div>
    </Sider>
  );
}

export default Sidebar;
