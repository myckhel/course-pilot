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
  MenuUnfoldOutlined,
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
  const { theme, setTheme } = useUIStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => {
        navigate("/profile");
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
    <AntHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 lg:px-6 h-16 flex items-center sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between w-full">
        {/* Left Section */}
        <div className="flex items-center">
          {showMenuButton && (
            <Button
              type="text"
              icon={
                <MenuUnfoldOutlined className="text-gray-600 dark:text-gray-300 text-lg" />
              }
              onClick={onMenuToggle}
              className="mr-2 sm:mr-4 hover:bg-gray-100 dark:hover:bg-gray-700"
              size="large"
            />
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle */}
          <Space
            align="center"
            className="border-r border-gray-200 dark:border-gray-700 pr-2 sm:pr-4"
          >
            <Switch
              checked={theme === "dark"}
              onChange={handleThemeToggle}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
              size="small"
            />
          </Space>

          {/* User Menu */}
          {user && (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Button
                type="text"
                className="flex items-center space-x-1 sm:space-x-2 h-auto py-1 px-1 sm:px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  className="bg-blue-500"
                />
                <Text className="hidden sm:inline text-gray-700 dark:text-gray-200 text-sm">
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
