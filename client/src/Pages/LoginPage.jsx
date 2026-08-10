import React, { useState } fromlocalhost 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import '../StyleSheet/LoginPage.css'; 

const { Title } = Typography;

function LoginPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  // 🚀 STATE ENGINE: Toggle between login view or sign-up view dynamically
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleFormSubmit = async (values) => {
    const endpoint = isRegisterMode ? '/api/register' : '/api/login';
    try {
      const response = await fetch(`[https://textile-backend-jhm4.onrender.com](https://textile-backend-jhm4.onrender.com)${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(data.message || 'Action completed successfully!');
        if (isRegisterMode) {
          setIsRegisterMode(false); // Switch back to login view after successful setup
          form.resetFields();
        } else {
          navigate('/dashboard');
        }
      } else {
        message.error(data.message || 'Authentication error.');
      }
    } catch (err) {
      console.error("Connection Error:", err);
      message.error('Failed to communicate with authentication server.');
    }
  };

  return (
    <div className="login-page-wrapper">
      <Card className="login-frosted-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={3} className="login-system-title">
            {isRegisterMode ? 'Create Master Account' : 'Textiles Management Portal'}
          </Title>
        </div>

        <Form form={form} name="auth_form" layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item 
            name="username" 
            label="Username" 
            rules={[{ required: true, message: 'Please input a username!' }]}
          >
            <Input size="large" placeholder="Enter alphanumeric identifier" />
          </Form.Item>

          <Form.Item 
            name="password" 
            label="Secure Passkey" 
            rules={[{ required: true, message: 'Please input your password configuration!' }]}
          >
            <Input.Password size="large" placeholder="Enter account password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 4 }}>
            <Button type="primary" htmlType="submit" block size="large" style={{ height: '45px', marginTop: '12px', borderRadius: '6px', fontWeight: 'bold' }}>
              {isRegisterMode ? 'Register Account' : 'Login'}
            </Button>
          </Form.Item>
        </Form>

        {/* 🚀 LINK SWITCHER: Switches layout context dynamically without leaving the viewport */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button type="link" onClick={() => { setIsRegisterMode(!isRegisterMode); form.resetFields(); }} style={{ color: '#1890ff', padding: 0 }}>
            {isRegisterMode ? 'Already have an account? Log in here' : "Don't have an account? Create one here"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default LoginPage;