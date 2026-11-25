import { Button, Card, Form, Input, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { graphqlRequest } from "../api/graphql";
import { RESET_PASSWORD } from "../graphql/mutations";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Backend reset links have the form /reset-password/<uid>/<token>
  const { uid, token } = useParams();

  useEffect(() => {
    if (!uid || !token) {
      message.error("Invalid or missing reset link!");
      navigate("/login");
    }
  }, [uid, token, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = await graphqlRequest(RESET_PASSWORD, {
        uid,
        token,
        newPassword: values.password,
      });

      if (data?.resetPassword?.success) {
        message.success(data.resetPassword.message || "Password reset successfully!", 5);
        navigate("/login");
      } else {
        throw new Error(data?.resetPassword?.message || "Password reset failed");
      }
    } catch (error) {
      message.error(error.message || "Failed to reset password. Try again.", 5);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        background: "linear-gradient(to bottom,  #727BD8 0%, #727bd86e 40%, #f4f7f0 100%)",
      }}
    >
      <Card
        style={{
          width: 500,
          borderRadius: 12,
          padding: 32,
          background: "#ffffff",
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            Reset Password
          </Title>
          <Text type="secondary">
            Enter your new password to reset your account.
          </Text>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="New Password"
            name="password"
            rules={[
              { required: true, message: "Password is required" },
              { min: 8, message: "Password must be at least 8 characters" },
              { pattern: /[A-Za-z]/, message: "Password must contain at least one letter" },
              { pattern: /\d/, message: "Password must contain at least one number" },
            ]}
          >
            <Input.Password placeholder="Enter new password" size="large" />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" size="large" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Text
            type="secondary"
            style={{ fontSize: 12, cursor: "pointer", color: "#368980" }}
            onClick={() => navigate("/login")}
          >
            Back to Login
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;
