import React, { useState, useEffect } from 'react';
import { Layout, Menu, Table, Tag, Typography, Button, Space, Popconfirm, message } from 'antd';
import { DashboardOutlined, FileTextOutlined, ShoppingCartOutlined, UserOutlined, LogoutOutlined, PlusOutlined, BarChartOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function OrderReportPage() {
    const navigate = useNavigate();
    const [completedOrders, setCompletedOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetch('https://textile-backend-jhm4.onrender.com/api/orders-manifest');
            const data = await res.json();
            if (data.success) {
                const allOrders = data.data || [];
                // Filter completed orders to display in Saved Orders Portal
                setCompletedOrders(allOrders.filter(o => o.Ordered_Products && o.Ordered_Products[0]?.Order_Status === 'COMPLETED'));
            }
        } catch (err) {
            message.error("Failed to load historical database records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const deleteOrderBundle = async (invoiceNo) => {
        try {
            const res = await fetch(`https://textile-backend-jhm4.onrender.com/api/orders/${encodeURIComponent(invoiceNo)}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                message.success("Order file record deleted.");
                loadData();
            }
        } catch (err) {
            message.error("Failed to delete targeted order log.");
        }
    };

    // 🚀 SUB-TABLE COMPONENT: Renders inside the expanded '+' row
    const renderPurchasedItemsSubTable = (orderedProductsArray) => {
        const nestedColumns = [
            { title: 'No', render: (_, __, index) => index + 1, width: 50, align: 'center' },
            { title: 'Label / Brand Name', dataIndex: 'Product_Name', key: 'Product_Name', render: t => <strong>{t}</strong> },
            { title: 'HSN Code', dataIndex: 'HSN_Code', key: 'HSN_Code', align: 'center' },
            { title: 'Size', dataIndex: 'Size', key: 'Size', align: 'center' },
            { title: 'Qty', dataIndex: 'QTY', key: 'QTY', align: 'center' },
            { title: 'Base Rate', dataIndex: 'Rate', key: 'Rate', align: 'right', render: r => `₹${Number(r || 0).toFixed(2)}` },
            { title: 'Total Amount', dataIndex: 'Amount', key: 'Amount', align: 'right', render: a => <strong>₹{Number(a || 0).toFixed(2)}</strong> }
        ];

        return (
            <Table 
                columns={nestedColumns} 
                dataSource={orderedProductsArray || []} 
                pagination={false} 
                size="small" 
                bordered 
                rowKey={(item, idx) => item.Product_Name + idx} 
                style={{ background: '#f9fbfd', margin: '8px 0' }} 
            />
        );
    };

    const orderColumns = [
        { title: 'Invoice Ref No', dataIndex: 'Invoice_No', key: 'Invoice_No', render: t => <strong style={{ color: '#1890ff' }}>{t}</strong> },
        { title: 'Customer Name', dataIndex: 'Customer_name', key: 'Customer_name' },
        { title: 'Company / Brand', dataIndex: 'Company_Name', key: 'Company_Name' },
        { title: 'Destination State', dataIndex: 'State', key: 'State' },
        { 
            title: 'Items Booked', 
            dataIndex: 'Ordered_Products', 
            key: 'items', 
            render: arr => <Tag color="blue">{Array.isArray(arr) ? arr.length : 0} Items Listed</Tag> 
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            width: 100,
            render: (_, record) => (
                <Popconfirm 
                    title="Delete this order history?" 
                    onConfirm={() => deleteOrderBundle(record.Invoice_No)} 
                    okText="Yes" 
                    cancelText="No" 
                    okButtonProps={{ danger: true }}
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            )
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={240}>
                <div className="sidebar-logo-container"><span className="sidebar-logo-text">Textiles</span></div>
                <Menu theme="dark" mode="inline" selectedKeys={['/reports/orders']} defaultOpenKeys={['reports_submenu']} onClick={(info) => navigate(info.key)} inlineIndent={16} style={{ textAlign: 'left' }}
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
                        { key: '/login', icon: <LogoutOutlined />, label: 'Logout' },
                    ]} 
                />
            </Sider>

            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <Title level={4} style={{ margin: 0 }}>Saved Orders Registry Portal 📦</Title>
                </Header>

                <Content style={{ padding: '24px', background: '#fff' }}>
                    {/* 🚀 EXPANDABLE PROP ADDS THE '+' ICON AUTOMATICALLY TO THE LEFT */}
                    <Table 
                        dataSource={completedOrders} 
                        columns={orderColumns} 
                        rowKey="Invoice_No" 
                        size="small" 
                        loading={loading} 
                        bordered={false} 
                        pagination={{ pageSize: 10 }} 
                        expandable={{ 
                            expandedRowRender: (record) => renderPurchasedItemsSubTable(record.Ordered_Products),
                            defaultExpandAllRows: false
                        }}
                    />
                </Content>
            </Layout>
        </Layout>
    );
}

export default OrderReportPage;