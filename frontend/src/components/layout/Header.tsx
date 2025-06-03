import React from "react";
import {
  Layout,
  Button,
  Avatar,
  Dropdown,
  Space,
  Switch,
  Typography,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useAuthStore, useUIStore } from "@/stores";
import { useNavigate } from "react-router-dom";
import type { MenuProps } from "antd";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

function Header({ onMenuToggle, showMenuButton = false }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => {
        // TODO: Navigate to profile page
      },
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 shadow-sm">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-4">
          {showMenuButton && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={onMenuToggle}
              className="lg:hidden"
            />
          )}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GT</span>
            </div>
            <Text strong className="text-lg text-gray-900 dark:text-gray-100">
              GSTutor
            </Text>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Space>
            <SunOutlined className="text-gray-600 dark:text-gray-300" />
            <Switch
              checked={theme === "dark"}
              onChange={toggleTheme}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
              size="small"
            />
            <MoonOutlined className="text-gray-600 dark:text-gray-300" />
          </Space>

          {/* User Menu */}
          {user && (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button
                type="text"
                className="flex items-center space-x-2 h-auto p-2"
              >
                <Avatar size="small" icon={<UserOutlined />} />
                <Text className="hidden sm:inline text-gray-700 dark:text-gray-200">
                  {user.name || user.email}
                </Text>
              </Button>
            </Dropdown>
          )}
        </div>
      </div>
    </AntHeader>
  );
}

export default Header;
