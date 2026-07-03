import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Row, Col, Statistic, Table, Typography } from 'antd';
import { DashboardOutlined, FileTextOutlined, ShoppingCartOutlined, UserOutlined, LogoutOutlined, ArrowUpOutlined, PlusOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;  

function DashboardPage() {
    const navigate = useNavigate();
    
    // State Engine Variables
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Data Stream Routine Loop
    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, custRes] = await Promise.all([
                fetch('http://localhost:5001/api/products'),
                fetch('http://localhost:5001/api/customers'),
            ]);
            const prodData = await prodRes.json();
            const custData = await custRes.json();

            if (prodData && prodData.success) setProducts(prodData.data || []);
            if (custData && custData.success) setCustomers(custData.data || []);
        } catch (error) {
            console.error('Error connecting to API gateway loop:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Calculation Logic Matrix
    const totalGrossSales = products.reduce((sum, item) => sum + Number(item.Amount || 0), 0);
    const uniqueFabricTypesCount = products.length;

    const quickColumns = [
        { title: 'Particulars', dataIndex: 'Products', key: 'Products' },
        { title: 'HSN/SAC', dataIndex: 'HSN_Code', key: 'HSN_Code' },
        { title: 'Size', dataIndex: 'Size', key: 'Size', align: 'right' },
        { title: 'Rate', dataIndex: 'Rate', key: 'Rate', align: 'right', render: v => `₹${Number(v).toFixed(2)}` },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
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
                                { key: '/reports?tab=1', label: 'Saved Invoices Portal' },
                                { key: '/reports?tab=2', label: 'Saved Orders Portal' }
                            ]
                        },
                        { key: '/login', icon: <LogoutOutlined />, label: 'Logout' }
                    ]}
                    onClick={(info) => navigate(info.key)}
                />
            </Sider>

            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>Business Analytics</Title>
                </Header>

                <Content style={{ padding: '24px', background: '#f8fafc', overflowY: 'auto' }}>
                    
                    {/* LIVE SCORECARDS ANALYTICS HEADER */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col xs={24} sm={12} lg={6}>
                            {/* 🚀 FIXED: Swapped bordered={false} with variant="borderless" */}
                            <Card variant="borderless" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                {/* 🚀 FIXED: Swapped valueStyle with styles={{ content: ... }} */}
                                <Statistic 
                                    title="Gross Revenue Flow" 
                                    value={totalGrossSales} 
                                    precision={2} 
                                    prefix="₹" 
                                    styles={{ content: { color: '#3f8600', fontWeight: 'bold' } }} 
                                    icon={<ArrowUpOutlined />} 
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            {/* 🚀 FIXED: Swapped bordered={false} with variant="borderless" */}
                            <Card variant="borderless" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderTop: '3px solid #1890ff' }}>
                                {/* 🚀 FIXED: Swapped valueStyle with styles={{ content: ... }} */}
                                <Statistic 
                                    title="Active Fabric Items" 
                                    value={uniqueFabricTypesCount} 
                                    styles={{ content: { color: '#1890ff', fontWeight: 'bold' } }} 
                                    suffix="Varieties" 
                                />
                            </Card>
                        </Col>
                    </Row>
                    
                    {/* PARTICULARS OVERVIEW GRID ROW */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={16}>
                            {/* 🚀 FIXED: Swapped bordered={false} with variant="borderless" */}
                            <Card variant="borderless" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} loading={loading}>
                                <Table 
                                    dataSource={products} 
                                    columns={quickColumns}
                                    pagination={false} 
                                    rowKey="Products" 
                                    size="small"
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