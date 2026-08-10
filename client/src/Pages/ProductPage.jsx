import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Button, Form, Input, Table, Space, Popconfirm, Modal, message } from 'antd';
import { DashboardOutlined, FileTextOutlined, ShoppingCartOutlined, UserOutlined, LogoutOutlined, PlusOutlined, DeleteOutlined, EditOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../StyleSheet/ProductPage.css';

const { Header, Sider, Content } = Layout;

function ProductsPage() {
    const navigate = useNavigate();
    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchText, setSearchText] = useState('');

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch('[https://textile-backend-jhm4.onrender.com](https://textile-backend-jhm4.onrender.com)/api/products');
            const data = await res.json();
            if (data.success) setProducts(data.data || []);
        } catch (err) {
            message.error("Failed to fetch product profiles.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleAddProduct = async () => {
        try {
            const values = await addForm.validateFields();
            const res = await fetch('[https://textile-backend-jhm4.onrender.com](https://textile-backend-jhm4.onrender.com)/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });
            const data = await res.json();
            if (data.success) {
                message.success("Product added successfully!");
                addForm.resetFields();
                setIsAddModalVisible(false);
                fetchProducts();
            }
        } catch (err) {
            message.error("Validation failed or API Error.");
        }
    };

    const handleEditClick = (record) => {
        setEditingProduct(record);
        editForm.setFieldsValue(record);
        setIsEditModalVisible(true);
    };

    const handleUpdateProduct = async () => {
        try {
            const values = await editForm.validateFields();
            // Target the unique string record under the new "item" key column
            const productIdentifier = editingProduct.item;
            
            const res = await fetch(`[https://textile-backend-jhm4.onrender.com](https://textile-backend-jhm4.onrender.com)/api/products/${encodeURIComponent(productIdentifier)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });
            const data = await res.json();
            if (data.success) {
                message.success("Product updated successfully!");
                setIsEditModalVisible(false);
                fetchProducts();
            }
        } catch (err) {
            message.error("Update request failed.");
        }
    };

    const deleteProduct = async (itemKey) => {
        try {
            const res = await fetch(`[https://textile-backend-jhm4.onrender.com](https://textile-backend-jhm4.onrender.com)/api/products/${encodeURIComponent(itemKey)}`, { 
                method: 'DELETE' 
            });
            const data = await res.json();
            if (data.success) {
                message.success("Product blueprint removed.");
                fetchProducts();
            }
        } catch (err) {
            message.error("Delete call aborted.");
        }
    };

    // Filter array using updated lowercase spreadsheet labels
    const filteredProducts = products.filter(row => {
        const itemVal = String(row?.item || '').toLowerCase();
        const labelVal = String(row?.lable || '').toLowerCase();
        const typeVal = String(row?.type || '').toLowerCase();
        const search = searchText.toLowerCase().trim();
        return itemVal.includes(search) || labelVal.includes(search) || typeVal.includes(search);
    });

    // Modified Ant-Design table maps directly to: item, lable, size, type
    const columns = [
        { title: 'Item', dataIndex: 'item', key: 'item', render: (text) => <strong>{text || '—'}</strong> },
        { title: 'Label', dataIndex: 'lable', key: 'lable', render: (text) => text || '—' },
        { title: 'HSN Code', dataIndex: 'HSN_Code', key: 'HSN_Code', render: (text) => text || '—' },
        { title: 'Size Standard', dataIndex: 'size', key: 'size', render: (text) => text || '—' },
        { title: 'Type', dataIndex: 'type', key: 'type', render: (text) => text || '—' },
        { 
            title: 'Actions', 
            key: 'actions', 
            width: 120, 
            render: (_, record) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => handleEditClick(record)} />
                    <Popconfirm 
                        title="Delete product record?" 
                        onConfirm={() => deleteProduct(record.item)} 
                        okText="Yes" 
                        cancelText="No"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={240}>
                <div className="sidebar-logo-container"><span className="sidebar-logo-text">Textiles</span></div>
                <Menu
                    theme="dark" mode="inline" selectedKeys={['/products']}
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
                        { key: '/login', icon: <LogoutOutlined />, label: 'Logout' },
                    ]}
                    onClick={(info) => navigate(info.key)}
                />
            </Sider>

            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Products Workspace</span>
                    <Space size="middle">
                        <Input 
                            placeholder="Search item or brand..." 
                            allowClear 
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: '260px', borderRadius: 0 }} 
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalVisible(true)} >
                            Insert Product
                        </Button>
                    </Space>
                </Header>

                <Content style={{ padding: '24px', background: '#f8fafc', overflowY: 'auto' }}>
                    <Card variant="borderless">
                        <Table dataSource={filteredProducts} columns={columns} rowKey="item" loading={loading} size="small" pagination={{ pageSize: 10 }} />
                    </Card>
                </Content>
            </Layout>

            {/* Register New Product Modal */}
            <Modal title="Register New Product" open={isAddModalVisible} onOk={handleAddProduct} onCancel={() => setIsAddModalVisible(false)} destroyOnClose>
                <Form form={addForm} layout="vertical">
                    <Form.Item name="item" label="Item Description / Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="lable" label="Label (e.g. Lungi Brand Name)" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="HSN_Code" label="HSN Code" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="size" label="Size Layout" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="type" label="Type" rules={[{ required: true }]}><Input /></Form.Item>
                </Form>
            </Modal>

            {/* Edit Product Modal */}
            <Modal title="Modify Product Record" open={isEditModalVisible} onOk={handleUpdateProduct} onCancel={() => setIsEditModalVisible(false)} destroyOnClose>
                <Form form={editForm} layout="vertical">
                    <Form.Item name="item" label="Item Description / Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="lable" label="Label / Brand Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="HSN_Code" label="HSN Code" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="size" label="Size Layout" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="type" label="Type" rules={[{ required: true }]}><Input /></Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
}

export default ProductsPage;