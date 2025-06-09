import { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Typography,
  Row,
  Col,
  Divider,
  Tag,
  Space,
  message,
  Modal,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CameraOutlined,
  MailOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  LockOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import { useAuthStore } from "@/stores";
import { userApi } from "@/apis";
import type { UpdateProfileData, ChangePasswordData } from "@/types";

const { Title, Text } = Typography;

function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) {
    return null;
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to current user data when canceling edit
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
      });
    } else {
      // Set current user data when starting to edit
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleProfileUpdate = async (values: UpdateProfileData) => {
    try {
      setIsUpdating(true);
      const response = await userApi.updateProfile(values);
      updateUser(response.data.user);
      message.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: unknown) {
      console.error("Profile update error:", error);
      message.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (values: ChangePasswordData) => {
    try {
      setIsChangingPassword(true);
      await userApi.changePassword(values);
      message.success("Password changed successfully");
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error: unknown) {
      console.error("Password change error:", error);
      message.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarUpload: UploadProps["beforeUpload"] = async (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must be smaller than 2MB!");
      return false;
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await userApi.uploadAvatar(formData);

      // Update user with new avatar URL
      const updatedUser = { ...user, avatar: response.data.avatar_url };
      updateUser(updatedUser);
      message.success("Avatar updated successfully");
    } catch (error: unknown) {
      console.error("Avatar upload error:", error);
      message.error("Failed to upload avatar");
    }

    return false; // Prevent default upload behavior
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "red";
      case "student":
        return "blue";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "inactive":
        return "orange";
      case "suspended":
        return "red";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>My Profile</Title>
        <Button
          type={isEditing ? "default" : "primary"}
          icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
          onClick={isEditing ? form.submit : handleEditToggle}
          loading={isUpdating}
        >
          {isEditing ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>

      <Row gutter={24}>
        {/* Profile Card */}
        <Col xs={24} lg={8}>
          <Card className="text-center">
            <div className="relative inline-block mb-4">
              <Avatar
                size={120}
                src={user.avatar}
                icon={<UserOutlined />}
                className="bg-blue-500"
              />
              {isEditing && (
                <Upload
                  showUploadList={false}
                  beforeUpload={handleAvatarUpload}
                  accept="image/*"
                >
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<CameraOutlined />}
                    size="small"
                    className="absolute bottom-0 right-0 shadow-lg"
                  />
                </Upload>
              )}
            </div>

            <Title level={4} className="mb-2">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.name}
            </Title>

            <Text type="secondary" className="block mb-4">
              @{user.name}
            </Text>

            <Space direction="vertical" size="small" className="w-full">
              <div className="flex justify-center">
                <Tag color={getRoleColor(user.role)} className="mb-2">
                  {user.role?.toUpperCase()}
                </Tag>
              </div>
              <div className="flex justify-center">
                <Tag color={getStatusColor(user.status)}>
                  {user.status?.toUpperCase()}
                </Tag>
              </div>
            </Space>

            <Divider />

            <Space
              direction="vertical"
              size="small"
              className="w-full text-left"
            >
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <MailOutlined className="mr-2" />
                <Text className="text-sm">{user.email}</Text>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <CalendarOutlined className="mr-2" />
                <Text className="text-sm">
                  Joined {formatDate(user.createdAt)}
                </Text>
              </div>
              {user.last_login && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <ClockCircleOutlined className="mr-2" />
                  <Text className="text-sm">
                    Last active {formatDate(user.last_login)}
                  </Text>
                </div>
              )}
            </Space>

            <Divider />

            <Button
              type="default"
              icon={<LockOutlined />}
              onClick={() => setPasswordModalVisible(true)}
              className="w-full"
            >
              Change Password
            </Button>
          </Card>
        </Col>

        {/* Profile Details */}
        <Col xs={24} lg={16}>
          <Card title="Profile Information">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleProfileUpdate}
              disabled={!isEditing}
              initialValues={{
                name: user.name,
                email: user.email,
                first_name: user.first_name || "",
                last_name: user.last_name || "",
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Username"
                    rules={[
                      { required: true, message: "Please enter username" },
                      {
                        min: 3,
                        message: "Username must be at least 3 characters",
                      },
                    ]}
                  >
                    <Input placeholder="Enter username" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Please enter email" },
                      { type: "email", message: "Please enter valid email" },
                    ]}
                  >
                    <Input placeholder="Enter email" />
                  </Form.Item>
                </Col>
              </Row>

              {/* <Row gutter={16}>
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
              </Row> */}

              {isEditing && (
                <div className="flex justify-end space-x-2">
                  <Button onClick={handleEditToggle}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={isUpdating}>
                    Save Changes
                  </Button>
                </div>
              )}
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            name="current_password"
            label="Current Password"
            rules={[
              { required: true, message: "Please enter current password" },
            ]}
          >
            <Input.Password placeholder="Enter current password" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="New Password"
            rules={[
              { required: true, message: "Please enter new password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Confirm New Password"
            dependencies={["new_password"]}
            rules={[
              { required: true, message: "Please confirm new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setPasswordModalVisible(false);
                passwordForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isChangingPassword}
            >
              Change Password
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default ProfilePage;
