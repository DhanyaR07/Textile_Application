import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';

// 💡 1. IMPORT THE NEW LOGIN BACKGROUND CSS STYLES
import '../StyleSheet/LoginPage.css'; 

const { Title } = Typography;

function LoginPage() {
  const navigate = useNavigate();

  const onLoginSubmit = async (values) => {
    try {
      const response = await fetch('http://localhost:5001/api/login',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(data.message || 'Welcome to the portal!');
        navigate('/dashboard');
      } else {
        message.error(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      console.error("Connection Error:", err);
      message.error('Failed to connect to authentication server.');
    }
  };

  return (
    /* 💡 2. APPLY THE FULL SCREEN WRAPPER LAYER HERE */
    <div className="login-page-wrapper">
      
      {/* 💡 3. THE CONTAINER USES THE PREMIUM FROSTED SKIN CLASS */}
      <Card className="login-frosted-card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Title level={3} className="login-system-title">Textiles Management Portal</Title>
        </div>

        <Form name="login" layout="vertical" onFinish={onLoginSubmit}>
          <Form.Item 
            name="username" 
            label="Username" 
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input size="large" placeholder="Enter registration identifier" />
          </Form.Item>

          <Form.Item 
            name="password" 
            label="Secure Passkey" 
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password size="large" placeholder="Enter password configuration" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 4 }}>
            <Button type="primary" htmlType="submit" block size="large" style={{ height: '45px', marginTop: '12px', borderRadius: '6px', fontWeight: 'bold' }}>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>

    </div>
  );
}

export default LoginPage;