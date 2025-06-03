import { Form, Input, Button, Checkbox, Alert } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth, useNotification } from "@/hooks";
import type { LoginFormData } from "@/types";

function LoginForm() {
  const [form] = Form.useForm();
  const { login, isLoading, error, clearError } = useAuth();
  const { notify } = useNotification();

  const handleSubmit = async (values: LoginFormData) => {
    try {
      clearError();
      await login({
        email: values.email,
        password: values.password,
      });
      notify.success("Login successful!", "Welcome back to GSTutor.");
    } catch (error: any) {
      // Error is handled by the store and displayed via error state
    }
  };

  return (
    <Form
      form={form}
      name="login"
      onFinish={handleSubmit}
      layout="vertical"
      size="large"
    >
      {error && (
        <Alert
          message="Login Failed"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="mb-4"
        />
      )}

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: "Please enter your email!" },
          { type: "email", message: "Please enter a valid email!" },
        ]}
      >
        <Input prefix={<UserOutlined />} placeholder="Enter your email" />
      </Form.Item>

      <Form.Item
        name="password"
        label="Password"
        rules={[{ required: true, message: "Please enter your password!" }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Enter your password"
        />
      </Form.Item>

      <Form.Item name="remember" valuePropName="checked">
        <Checkbox>Remember me</Checkbox>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isLoading} block>
          Sign In
        </Button>
      </Form.Item>
    </Form>
  );
}

export default LoginForm;
