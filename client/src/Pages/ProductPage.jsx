import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Button, Form, Input, InputNumber, Table, Space, Popconfirm, Modal, message } from 'antd';
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
    
    // 🚀 NEW: Add a Search String State Variable
    const [searchText, setSearchText] = useState('');

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:5001/api/products');
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
            const res = await fetch('http://localhost:5001/api/products', {
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
            const productIdentifier = editingProduct.Products || editingProduct.Lungi_Name;
            
            const res = await fetch(`http://localhost:5001/api/products/${encodeURIComponent(productIdentifier)}`, {
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

    const deleteProduct = async (productKey) => {
        try {
            const res = await fetch(`http://localhost:5001/api/products/${encodeURIComponent(productKey)}`, { 
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

    // 🚀 NEW: Filter items in real-time by Lungi Name or Product Name
    const filteredProducts = products.filter(item => {
        const lungi = String(item?.Lungi_Name || '').toLowerCase();
        const product = String(item?.Products || '').toLowerCase();
        const search = searchText.toLowerCase().trim();
        return lungi.includes(search) || product.includes(search);
    });

    const columns = [
        { title: 'Lungi Name', dataIndex: 'Lungi_Name', key: 'Lungi_Name', render: (text) => <strong>{text || '—'}</strong> },
        { title: 'Product Name', dataIndex: 'Products', key: 'Products', render: (text, record) => text || record.Lungi_Name || '—' },
        { title: 'HSN Code', dataIndex: 'HSN_Code', key: 'HSN_Code' },
        { title: 'Size Standard', dataIndex: 'Size', key: 'Size' },
        { title: 'Base Rate', dataIndex: 'Rate', key: 'Rate', render: r => `₹${Number(r).toFixed(2)}` },
        { 
            title: 'Actions', 
            key: 'actions', 
            width: 120, 
            render: (_, record) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => handleEditClick(record)} />
                    <Popconfirm 
                        title="Delete product blueprint?" 
                        onConfirm={() => deleteProduct(record.Products || record.Lungi_Name)} 
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
                {/* 🚀 INSERTED SEARCH BOX IN THE PRODUCT HEADER ROW */}
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Products</span>
                    <Space size="middle">
                        <Input 
                            placeholder="Search Product or Lungi..." 
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
                        {/* 🚀 DATA SOURCE POINTS TO FILTERED ARRAY */}
                        <Table dataSource={filteredProducts} columns={columns} rowKey="Products" loading={loading} size="small" pagination={{ pageSize: 10 }} />
                    </Card>
                </Content>
            </Layout>

            {/* Register New Product Modal */}
            <Modal title="Register New Product" open={isAddModalVisible} onOk={handleAddProduct} onCancel={() => setIsAddModalVisible(false)} destroyOnHidden>
                <Form form={addForm} layout="vertical">
                    <Form.Item name="Lungi_Name" label="Lungi Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="Products" label="Product Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="HSN_Code" label="HSN Code" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="Size" label="Default Size"><Input /></Form.Item>
                    <Form.Item name="Rate" label="Base Rate" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
                </Form>
            </Modal>

            {/* Edit Product Modal */}
            <Modal title="Modify Product Record" open={isEditModalVisible} onOk={handleUpdateProduct} onCancel={() => setIsEditModalVisible(false)} destroyOnHidden>
                <Form form={editForm} layout="vertical">
                    <Form.Item name="Lungi_Name" label="Lungi Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="Products" label="Product Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="HSN_Code" label="HSN Code" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="Size" label="Size Standard"><Input /></Form.Item>
                    <Form.Item name="Rate" label="Base Unit Rate" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
}

export default ProductsPage;