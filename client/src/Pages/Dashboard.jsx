import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Row, Col, Statistic, Typography, Button, Space } from 'antd';
import { 
    DashboardOutlined, FileTextOutlined, ShoppingCartOutlined, 
    UserOutlined, LogoutOutlined, PlusOutlined, BarChartOutlined, 
    InboxOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;  

function DashboardPage() {
    const navigate = useNavigate();
    
    // State Engine Variables
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Data Stream Routine Loop
    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, custRes, orderRes] = await Promise.all([
                fetch('http://localhost:5001/api/products'),
                fetch('http://localhost:5001/api/customers'),
                fetch('http://localhost:5001/api/orders-manifest')
            ]);

            const prodData = await prodRes.json();
            const custData = await custRes.json();
            const orderData = await orderRes.json();

            if (prodData && prodData.success) setProducts(prodData.data || []);
            if (custData && custData.success) setCustomers(custData.data || []);
            if (orderData && orderData.success) setOrders(orderData.data || []);

        } catch (error) {
            console.error('Error connecting to API gateway loop:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Calculated Business KPIs
    const totalCustomersCount = customers.length;
    const totalProductsCount = products.length;
    const totalOrdersCount = orders.length;

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* SIDEBAR NAVIGATION */}
            <Sider width={240}>
                <div className="sidebar-logo-container"><span className="sidebar-logo-text">Textiles</span></div>
                <Menu
                    theme="dark" mode="inline" selectedKeys={['/dashboard']}
                    inlineIndent={16} style={{ textAlign: 'left' }}
                    items={[
                        { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
                        { key: '/products', icon: <ShoppingCartOutlined />, label: 'Products' },
                        { key: '/customers', icon: <UserOutlined />, label: 'Customers' },
                        { key: '/orders', icon: <PlusOutlined />, label: 'Order Purchased' },
                        { key: '/invoices', icon: <FileTextOutlined />, label: 'Invoices' },
                        { 
                            key: 'reports_submenu', 
                            icon: <BarChartOutlined />, 
                            label: 'Reports Workspace',
                            children: [
                                { key: '/reports/invoices', label: 'Saved Invoices Portal' },
                                { key: '/reports/orders', label: 'Saved Orders Portal' }
                            ]
                        },
                        { key: '/login', icon: <LogoutOutlined />, label: 'Logout' }
                    ]}
                    onClick={(info) => navigate(info.key)}
                />
            </Sider>

            <Layout>
                {/* HEADER SECTION */}
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
                    <Title level={4} style={{ margin: 0 }}>Business Analytics Overview</Title>
                    <Space size="middle">
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/orders')}>
                            New Order
                        </Button>
                        <Button style={{ background: '#000', color: '#fff', borderColor: '#000' }} icon={<FileTextOutlined />} onClick={() => navigate('/invoices')}>
                            Create Invoice
                        </Button>
                    </Space>
                </Header>

                <Content style={{ padding: '24px', background: '#f8fafc', overflowY: 'auto' }}>
                    
                    {/* 📊 LIVE KPI ANALYTICS SCORECARDS */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={8}>
                            <Card variant="borderless" loading={loading} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderTop: '3px solid #1890ff' }}>
                                <Statistic 
                                    title="Total Active Products" 
                                    value={totalProductsCount} 
                                    styles={{ content: { color: '#1890ff', fontWeight: 'bold' } }} 
                                    suffix="Items" 
                                    icon={<InboxOutlined />}
                                />
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} lg={8}>
                            <Card variant="borderless" loading={loading} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderTop: '3px solid #722ed1' }}>
                                <Statistic 
                                    title="Registered Clients" 
                                    value={totalCustomersCount} 
                                    styles={{ content: { color: '#722ed1', fontWeight: 'bold' } }} 
                                    suffix="Clients" 
                                    icon={<UserOutlined />}
                                />
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} lg={8}>
                            <Card variant="borderless" loading={loading} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderTop: '3px solid #fa8c16' }}>
                                <Statistic 
                                    title="Total Orders Booked" 
                                    value={totalOrdersCount} 
                                    styles={{ content: { color: '#fa8c16', fontWeight: 'bold' } }} 
                                    suffix="Orders" 
                                />
                            </Card>
                        </Col>
                    </Row>

                </Content>
            </Layout>
        </Layout>
    );
}

export default DashboardPage;