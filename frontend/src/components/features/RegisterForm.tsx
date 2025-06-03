import React from "react";
import { Form, Input, Button, Select, Alert, Divider } from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth, useNotification } from "@/hooks";
import { validatePassword } from "@/utils";
import type { RegisterFormData } from "@/types";

const { Option } = Select;

function RegisterForm() {
  const [form] = Form.useForm();
  const { register, isLoading, error, clearError } = useAuth();
  const { notify } = useNotification();

  const handleSubmit = async (values: RegisterFormData) => {
    try {
      clearError();
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      notify.success("Registration successful!", "Welcome to GSTutor.");
    } catch (error: any) {
      // Error is handled by the store and displayed via error state
    }
  };

  const validateConfirmPassword = (_: any, value: string) => {
    const password = form.getFieldValue("password");
    if (value && password !== value) {
      return Promise.reject(new Error("Passwords do not match!"));
    }
    return Promise.resolve();
  };

  const validatePasswordStrength = (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }

    const validation = validatePassword(value);
    if (!validation.valid) {
      return Promise.reject(new Error(validation.errors[0]));
    }
    return Promise.resolve();
  };

  return (
    <Form
      form={form}
      name="register"
      onFinish={handleSubmit}
      layout="vertical"
      size="large"
    >
      {error && (
        <Alert
          message="Registration Failed"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="mb-4"
        />
      )}

      <Form.Item
        name="username"
        label="Username"
        rules={[
          { required: true, message: "Please enter your username!" },
          { min: 3, message: "Username must be at least 3 characters!" },
          { max: 20, message: "Username must be less than 20 characters!" },
          {
            pattern: /^[a-zA-Z0-9_]+$/,
            message:
              "Username can only contain letters, numbers, and underscores!",
          },
        ]}
      >
        <Input prefix={<UserOutlined />} placeholder="Enter your username" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: "Please enter your email!" },
          { type: "email", message: "Please enter a valid email!" },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="Enter your email" />
      </Form.Item>

      <Form.Item
        name="password"
        label="Password"
        rules={[
          { required: true, message: "Please enter your password!" },
          { validator: validatePasswordStrength },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Enter your password"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="Confirm Password"
        dependencies={["password"]}
        rules={[
          { required: true, message: "Please confirm your password!" },
          { validator: validateConfirmPassword },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Confirm your password"
        />
      </Form.Item>

      <Divider />

      <Form.Item
        name="role"
        label="Account Type"
        rules={[
          { required: true, message: "Please select your account type!" },
        ]}
        initialValue="student"
      >
        <Select placeholder="Select account type">
          <Option value="student">
            Student - Access learning materials and ask questions
          </Option>
          <Option value="admin">
            Admin - Manage topics and upload materials
          </Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isLoading} block>
          Create Account
        </Button>
      </Form.Item>
    </Form>
  );
}

export default RegisterForm;
