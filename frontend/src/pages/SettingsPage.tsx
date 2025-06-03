import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  Upload,
  Avatar,
  message,
  Row,
  Col,
  Typography,
  Space,
  Modal,
  List,
  Tag,
} from "antd";
import {
  UserOutlined,
  CameraOutlined,
  LockOutlined,
  BellOutlined,
  GlobalOutlined,
  SaveOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

import { useAuthStore } from "@/stores/authStore";
import { userApi } from "@/apis";
import type {
  UpdateProfileData,
  ChangePasswordData,
  NotificationSettings,
} from "@/types";

const { Title, Text } = Typography;
const { Option } = Select;

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used?: string;
  permissions: string[];
}

function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<UploadFile | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [apiKeyForm] = Form.useForm();

  // Initialize forms with user data
  React.useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      });

      // Mock notification settings
      notificationForm.setFieldsValue({
        email_notifications: true,
        push_notifications: false,
        digest_frequency: "weekly",
        notification_types: ["mentions", "responses"],
      });
    }
  }, [user, profileForm, notificationForm]);

  const handleProfileUpdate = async (values: UpdateProfileData) => {
    try {
      setLoading(true);

      // Handle avatar upload
      let avatarUrl = user?.avatar;
      if (avatarFile?.originFileObj) {
        const formData = new FormData();
        formData.append("avatar", avatarFile.originFileObj);
        const uploadResponse = await userApi.uploadAvatar(formData);
        if (uploadResponse.data) {
          avatarUrl = uploadResponse.data.avatar_url;
        }
      }

      const updatedUser = await userApi.updateProfile({
        ...values,
        avatar: avatarUrl,
      });

      if (updatedUser.data) {
        updateUser(updatedUser.data);
      }
      message.success("Profile updated successfully");
    } catch {
      message.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: ChangePasswordData) => {
    try {
      setLoading(true);
      await userApi.changePassword(values);
      message.success("Password changed successfully");
      passwordForm.resetFields();
    } catch {
      message.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (values: NotificationSettings) => {
    try {
      setLoading(true);
      await userApi.updateNotificationSettings(values);
      message.success("Notification settings updated");
    } catch {
      message.error("Failed to update notification settings");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async (values: {
    name: string;
    permissions: string[];
  }) => {
    try {
      const response = await userApi.createApiKey(values);
      if (response.data) {
        setApiKeys([...apiKeys, response.data]);
      }
      message.success("API key created successfully");
      setApiKeyModalVisible(false);
      apiKeyForm.resetFields();
    } catch {
      message.error("Failed to create API key");
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    try {
      await userApi.deleteApiKey(keyId);
      setApiKeys(apiKeys.filter((key) => key.id !== keyId));
      message.success("API key deleted successfully");
    } catch {
      message.error("Failed to delete API key");
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const renderProfileSettings = () => (
    <Card title="Profile Information">
      <Form
        form={profileForm}
        layout="vertical"
        onFinish={handleProfileUpdate}
        className="max-w-2xl"
      >
        <div className="flex items-center mb-6">
          <Avatar
            size={80}
            icon={<UserOutlined />}
            src={avatarFile?.url || user?.avatar}
            className="mr-4"
          />
          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              setAvatarFile({
                uid: file.uid,
                name: file.name,
                url: URL.createObjectURL(file),
                originFileObj: file,
              });
              return false;
            }}
            accept="image/*"
          >
            <Button icon={<CameraOutlined />}>Change Avatar</Button>
          </Upload>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="first_name" label="First Name">
              <Input placeholder="Enter first name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="last_name" label="Last Name">
              <Input placeholder="Enter last name" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: "Username is required" }]}
        >
          <Input placeholder="Enter username" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Email is required" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="Enter email" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
          >
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderSecuritySettings = () => (
    <Card title="Security Settings">
      <Form
        form={passwordForm}
        layout="vertical"
        onFinish={handlePasswordChange}
        className="max-w-md"
      >
        <Form.Item
          name="current_password"
          label="Current Password"
          rules={[{ required: true, message: "Current password is required" }]}
        >
          <Input.Password placeholder="Enter current password" />
        </Form.Item>

        <Form.Item
          name="new_password"
          label="New Password"
          rules={[
            { required: true, message: "New password is required" },
            { min: 8, message: "Password must be at least 8 characters" },
          ]}
        >
          <Input.Password placeholder="Enter new password" />
        </Form.Item>

        <Form.Item
          name="confirm_password"
          label="Confirm New Password"
          dependencies={["new_password"]}
          rules={[
            { required: true, message: "Please confirm your password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("new_password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm new password" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<LockOutlined />}
          >
            Change Password
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card title="Notification Preferences">
      <Form
        form={notificationForm}
        layout="vertical"
        onFinish={handleNotificationUpdate}
        className="max-w-md"
      >
        <Form.Item name="email_notifications" valuePropName="checked">
          <div className="flex justify-between items-center">
            <div>
              <Text strong>Email Notifications</Text>
              <div className="text-gray-500 text-sm">
                Receive notifications via email
              </div>
            </div>
            <Switch />
          </div>
        </Form.Item>

        <Form.Item name="push_notifications" valuePropName="checked">
          <div className="flex justify-between items-center">
            <div>
              <Text strong>Push Notifications</Text>
              <div className="text-gray-500 text-sm">
                Receive browser push notifications
              </div>
            </div>
            <Switch />
          </div>
        </Form.Item>

        <Form.Item name="digest_frequency" label="Email Digest Frequency">
          <Select placeholder="Select frequency">
            <Option value="daily">Daily</Option>
            <Option value="weekly">Weekly</Option>
            <Option value="monthly">Monthly</Option>
            <Option value="never">Never</Option>
          </Select>
        </Form.Item>

        <Form.Item name="notification_types" label="Notification Types">
          <Select mode="multiple" placeholder="Select notification types">
            <Option value="mentions">Mentions</Option>
            <Option value="responses">Response to my questions</Option>
            <Option value="new_topics">New topics available</Option>
            <Option value="system">System announcements</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<BellOutlined />}
          >
            Save Preferences
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderApiKeys = () => (
    <Card
      title="API Keys"
      extra={
        <Button type="primary" onClick={() => setApiKeyModalVisible(true)}>
          Create API Key
        </Button>
      }
    >
      <List
        dataSource={apiKeys}
        renderItem={(apiKey) => (
          <List.Item
            actions={[
              <Button
                type="text"
                icon={
                  visibleKeys.has(apiKey.id) ? (
                    <EyeInvisibleOutlined />
                  ) : (
                    <EyeOutlined />
                  )
                }
                onClick={() => toggleKeyVisibility(apiKey.id)}
              />,
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteApiKey(apiKey.id)}
              />,
            ]}
          >
            <List.Item.Meta
              title={apiKey.name}
              description={
                <div className="space-y-2">
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {visibleKeys.has(apiKey.id)
                      ? apiKey.key
                      : "••••••••••••••••"}
                  </div>
                  <div className="flex gap-2">
                    {apiKey.permissions.map((permission) => (
                      <Tag key={permission}>{permission}</Tag>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(apiKey.created_at).toLocaleDateString()}
                    {apiKey.last_used && (
                      <span>
                        {" "}
                        • Last used:{" "}
                        {new Date(apiKey.last_used).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title="Create API Key"
        open={apiKeyModalVisible}
        onCancel={() => setApiKeyModalVisible(false)}
        footer={null}
      >
        <Form form={apiKeyForm} layout="vertical" onFinish={handleCreateApiKey}>
          <Form.Item
            name="name"
            label="Key Name"
            rules={[
              {
                required: true,
                message: "Please enter a name for the API key",
              },
            ]}
          >
            <Input placeholder="Enter a descriptive name" />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="Permissions"
            rules={[
              {
                required: true,
                message: "Please select at least one permission",
              },
            ]}
          >
            <Select mode="multiple" placeholder="Select permissions">
              <Option value="read">Read</Option>
              <Option value="write">Write</Option>
              <Option value="delete">Delete</Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setApiKeyModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Key
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );

  const tabs = [
    {
      key: "profile",
      label: "Profile",
      icon: <UserOutlined />,
      content: renderProfileSettings,
    },
    {
      key: "security",
      label: "Security",
      icon: <LockOutlined />,
      content: renderSecuritySettings,
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: <BellOutlined />,
      content: renderNotificationSettings,
    },
    {
      key: "api",
      label: "API Keys",
      icon: <GlobalOutlined />,
      content: renderApiKeys,
    },
  ];

  return (
    <div className="p-6">
      <Title level={2}>Settings</Title>

      <div className="flex gap-6 mt-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Card className="p-0">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    activeTab === tab.key
                      ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                      : ""
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tabs.find((tab) => tab.key === activeTab)?.content()}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
