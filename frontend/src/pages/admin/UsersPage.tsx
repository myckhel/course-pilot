import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { SelectProps } from "antd/es/select";

import { userApi } from "@/apis/userApi";
import type { User, UserFormData } from "@/types";

const { Title } = Typography;
const { Option } = Select;

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    students: 0,
    admins: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Calculate stats whenever users change
    const total = users.length;
    const active = users.filter((u) => u.status === "active").length;
    const students = users.filter((u) => u.role === "student").length;
    const admins = users.filter((u) => u.role === "admin").length;

    setStats({ total, active, students, admins });
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsers();
      setUsers(response.data.data);
    } catch (error) {
      message.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      status: user.status,
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await userApi.deleteUser(userId);
      message.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      message.error("Failed to delete user");
    }
  };

  const handleModalSubmit = async (values: UserFormData) => {
    try {
      if (editingUser) {
        await userApi.updateUser(editingUser.id, values);
        message.success("User updated successfully");
      } else {
        await userApi.createUser(values);
        message.success("User created successfully");
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error(
        editingUser ? "Failed to update user" : "Failed to create user"
      );
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await userApi.exportUsers();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `users-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success("Users exported successfully");
    } catch (error) {
      message.error("Failed to export users");
    }
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
        return "red";
      case "suspended":
        return "orange";
      default:
        return "default";
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`
        .toLowerCase()
        .includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const columns: ColumnsType<User> = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      width: 60,
      render: (_, record) => (
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {record.first_name?.[0] || record.name[0].toUpperCase()}
        </div>
      ),
    },
    {
      title: "Name",
      key: "name",
      render: (_, record) => (
        <div>
          <div className="font-medium">
            {record.first_name && record.last_name
              ? `${record.first_name} ${record.last_name}`
              : record.name}
          </div>
          <div className="text-gray-500 text-sm">@{record.name}</div>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>{role.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Last Login",
      dataIndex: "last_login",
      key: "last_login",
      render: (date: string | null) =>
        date ? new Date(date).toLocaleDateString() : "Never",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditUser(record)}
            title="Edit user"
          />
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              title="Delete user"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const roleOptions: SelectProps["options"] = [
    { value: "all", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "student", label: "Student" },
  ];

  const statusOptions: SelectProps["options"] = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Users Management</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExportUsers}>
            Export
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        </Space>
      </div>

      {/* Statistics */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.total}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.active}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Students"
              value={stats.students}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Admins"
              value={stats.admins}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="Search users..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleOptions}
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              style={{ width: "100%" }}
            />
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} users`,
          }}
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={editingUser ? "Edit User" : "Create User"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleModalSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Username"
                rules={[
                  { required: true, message: "Please enter name" },
                  { min: 3, message: "Username must be at least 3 characters" },
                ]}
              >
                <Input placeholder="Enter name" />
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

          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: "Please select role" }]}
              >
                <Select placeholder="Select role">
                  <Option value="student">Student</Option>
                  <Option value="admin">Admin</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select placeholder="Select status">
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="suspended">Suspended</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default UsersPage;
