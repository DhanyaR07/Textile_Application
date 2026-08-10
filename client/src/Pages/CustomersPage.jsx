import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Button, Form, Input, Table, Space, Popconfirm, Modal, message } from 'antd';
import { DashboardOutlined, FileTextOutlined, ShoppingCartOutlined, UserOutlined, LogoutOutlined, PlusOutlined, DeleteOutlined, EditOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../StyleSheet/CustomersPage.css';

const { Header, Sider, Content } = Layout;

function CustomersPage() {
    const navigate = useNavigate();
    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();
    
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false); // 🚀 Add Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    const [searchText, setSearchText] = useState('');
    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:5001/api/customers');
            const data = await res.json();
            if (data.success) setCustomers(data.data || []);
        } catch (err) {
            message.error("Failed to connect to customers directory backend.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCustomers(); }, []);

    const handleAddCustomer = async () => {
        try {
            const values = await addForm.validateFields();
            const sanitized = {
                ...values,
                State: String(values.State || '').trim().toUpperCase(),
                GSTIN_NO: String(values.GSTIN_NO || '').trim().toUpperCase()
            };
            const res = await fetch('http://localhost:5001/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sanitized)
            });
            const data = await res.json();
            if (data.success) {
                message.success("Customer saved successfully.");
                addForm.resetFields();
                setIsAddModalVisible(false);
                fetchCustomers();
            }
        } catch (err) {
            message.error("Save error or validation failed.");
        }
    };

    const handleEditClick = (record) => {
        setEditingCustomer(record);
        editForm.setFieldsValue(record);
        setIsEditModalVisible(true);
    };

    const handleUpdateCustomer = async () => {
        try {
            const values = await editForm.validateFields();
            const sanitized = {
                ...values,
                State: String(values.State || '').trim().toUpperCase(),
                GSTIN_NO: String(values.GSTIN_NO || '').trim().toUpperCase()
            };
            
            const res = await fetch(`http://localhost:5001/api/customers/${editingCustomer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sanitized)
            });
            const data = await res.json();
            if (data.success) {
                message.success("Customer changes successfully saved to database!");
                setIsEditModalVisible(false);
                fetchCustomers();
            } else {
                message.error("Database update rejected.");
            }
        } catch (err) {
            message.error("Validation failed or server unreachable.");
        }
    };

    const deleteCustomer = async (id) => {
        if (!id) {
            message.error("Cannot resolve target row identification ID.");
            return;
        }
        try {
            const res = await fetch(`http://localhost:5001/api/customers/${id}`, { 
                method: 'DELETE' 
            });
            const data = await res.json();
            if (data.success) {
                message.success("Customer registry data permanently cleared!");
                fetchCustomers();
            } else {
                message.error(data.message || "Server rejected deletion request.");
            }
        } catch (err) {
            message.error("Failed to connect to API Gateway.");
        }
    };

    const filteredCustomers = customers.filter(customer => 
        customer.Name.toLowerCase().includes(searchText.toLowerCase()) ||
        customer.Company_Name.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        { title: 'Client Name', dataIndex: 'Name', key: 'Name', render: txt => <strong>{txt}</strong> },
        { title: 'Company / Brand', dataIndex: 'Company_Name', key: 'Company_Name' },
        { title: 'Full Address', dataIndex: 'Address', key: 'Address', ellipsis: true },
        { title: 'Registered State', dataIndex: 'State', key: 'State' },
        { title: 'State Code', dataIndex: 'StateCode', key: 'StateCode', align: 'center' },
        { title: 'GSTIN', dataIndex: 'GSTIN_NO', key: 'GSTIN_NO' },
        { title: 'Actions', key: 'actions', width: 120, render: (_, record) => (
            <Space size="middle">
                <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => handleEditClick(record)} />
                <Popconfirm 
                    title="Delete client file profile?" 
                    onConfirm={() => deleteCustomer(record.id)} 
                    okText="Yes" 
                    cancelText="No"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            </Space>
        )}
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={240}>
                <div className="sidebar-logo-container"><span className="sidebar-logo-text">Textiles</span></div>
                <Menu theme="dark" mode="inline" selectedKeys={['/customers']} onClick={(info) => navigate(info.key)} 
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
                    { key: '/login', icon: <LogoutOutlined />, label: 'Logout' },
                ]} />
            </Sider>

            <Layout>
                {/* 🚀 INSERT BUTTON INSTALLED IN HEADER */}
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Customer Directory</span>
                    <Space size="middle">
                        <Input 
                            placeholder="Search Product or Lungi..." 
                            allowClear 
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: '260px', borderRadius: 0 }} 
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalVisible(true)}>
                            Insert Customer
                        </Button>
                    </Space>
                </Header>

                <Content style={{ padding: '24px', background: '#f8fafc', overflowY: 'auto' }}>
                    <Card variant="borderless">
                        <Table dataSource={customers} columns={columns} rowKey="id" loading={loading} size="small" />
                    </Card>
                </Content>
            </Layout>

            {/* 🚀 NEW INSERT CUSTOMER POPUP MODAL */}
            <Modal title="Register New Customer" open={isAddModalVisible} onOk={handleAddCustomer} onCancel={() => setIsAddModalVisible(false)} destroyOnHidden>
                <Form 
                    form={addForm} 
                    layout="vertical"
                    onValuesChange={(changedValues) => {
                        if (changedValues.State) {
                            const stateInput = String(changedValues.State).trim().toUpperCase();
                            const stateCodesMap = {
                                'TAMIL NADU': '33', 'TAMILNADU': '33',
                                'MAHARASHTRA': '27', 'MAHARASTRA': '27',
                                'KARNATAKA': '29', 'KERALA': '32', 'GUJARAT': '24'
                            };
                            if (stateCodesMap[stateInput]) {
                                addForm.setFieldsValue({ StateCode: stateCodesMap[stateInput] });
                            }
                        }
                    }}
                >
                    <Form.Item name="Name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="Company_Name" label="Company"><Input /></Form.Item>
                    <Form.Item name="Address" label="Billing Address" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="State" label="State" rules={[{ required: true }]}><Input placeholder="TAMIL NADU" /></Form.Item>
                    <Form.Item name="StateCode" label="Code" rules={[{ required: true }]}><Input maxLength={3} /></Form.Item>
                    <Form.Item name="GSTIN_NO" label="GSTIN"><Input maxLength={15} /></Form.Item>
                </Form>
            </Modal>

            <Modal title="Modify Customer Record" open={isEditModalVisible} onOk={handleUpdateCustomer} onCancel={() => setIsEditModalVisible(false)} destroyOnHidden>
                <Form form={editForm} layout="vertical">
                    <Form.Item name="Name" label="Customer Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="Company_Name" label="Company / Brand"><Input /></Form.Item>
                    <Form.Item name="Address" label="Full Address" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
                    <Form.Item name="State" label="Registered State" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="StateCode" label="State Code" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="GSTIN_NO" label="GSTIN Number"><Input maxLength={15} /></Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
}

export default CustomersPage;