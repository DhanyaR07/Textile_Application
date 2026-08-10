import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Button, Form, Input, InputNumber, Table, Select, Space, message, Tag, Tabs, Popconfirm, Modal } from 'antd';
import { DashboardOutlined, FileTextOutlined, ShoppingCartOutlined, UserOutlined, LogoutOutlined, PlusOutlined, DeleteOutlined, SaveOutlined, HistoryOutlined, OrderedListOutlined, CheckCircleOutlined, EditOutlined, BarChartOutlined} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

function OrderPage() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]); 
    const [completedOrders, setCompletedOrders] = useState([]); 
    const [loading, setLoading] = useState(false);
    
    // States for Edit Modal
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingInvoiceNo, setEditingInvoiceNo] = useState('');
    const [editOrderItems, setEditOrderItems] = useState([]);

    const [orderItems, setOrderItems] = useState([
        { id: Date.now(), Product_Name: '', HSN_Code: '', QTY: 1, Size: '', Rate: 0, Amount: 0, Discount: 0 }
    ]);

    const loadPortalData = async () => {
        try {
            setLoading(true);
            const [prodRes, custRes, orderRes] = await Promise.all([
                fetch('https://textile-backend-jhm4.onrender.com/api/products'),
                fetch('https://textile-backend-jhm4.onrender.com/api/customers'),
                fetch('https://textile-backend-jhm4.onrender.com/api/orders-manifest') 
            ]);
            const prodData = await prodRes.json();
            const custData = await custRes.json();
            const orderData = await orderRes.json();
            
            if (prodData.success) setProducts(prodData.data || []);
            if (custData.success) setCustomers(custData.data || []);
            
            if (orderData.success) {
                const allOrders = orderData.data || [];
                setPendingOrders(allOrders.filter(o => o.Ordered_Products[0]?.Order_Status !== 'COMPLETED'));
                setCompletedOrders(allOrders.filter(o => o.Ordered_Products[0]?.Order_Status === 'COMPLETED'));
            }
        } catch (err) {
            message.error("Failed to sync structural portal dependencies.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPortalData(); }, []);

    const handleCustomerSelect = (custName) => {
        const matched = customers.find(c => c.Name === custName);
        if (matched) {
            form.setFieldsValue({
                Company_Name: matched.Company_Name || '',
                Address: matched.Address || '',
                State: matched.State || '',
                State_Code: matched.StateCode || '',
                GSTIN_NO: matched.GSTIN_NO || '',
                Phone_no: matched.phone_no || ''
            });
        }
    };

    const handleRowChange = (index, field, value) => {
        const updated = [...orderItems];
        updated[index][field] = value;

        if (field === 'Product_Name') {
            // 🚀 UPDATED: Checks against the "lable" key from your database schema instead of item description
            const matched = products.find(p => p.lable === value);
            if (matched) {
                updated[index].HSN_Code = matched.HSN_Code || '5402'; 
                updated[index].Size = matched.size || '';             
                updated[index].Rate = Number(matched.Rate || 25.00);  
                updated[index].Discount = Number(matched.Discount || 0);
                updated[index].QTY = 1; 
            }
        }
        updated[index].Amount = Number(updated[index].QTY || 0) * Number(updated[index].Rate || 0);
        setOrderItems(updated);
    };

    const addRow = () => setOrderItems([...orderItems, { id: Date.now() + Math.random(), Product_Name: '', HSN_Code: '', QTY: 1, Size: '', Rate: 0, Amount: 0, Discount: 0 }]);
    const removeRow = (index) => { if (orderItems.length > 1) setOrderItems(orderItems.filter((_, i) => i !== index)); };

    const handleSaveOrder = async () => {
        try {
            const customerMeta = await form.validateFields();
            setLoading(true);

            const savePromises = orderItems.map(item => {
                if (!item.Product_Name) return Promise.resolve();
                
                return fetch('https://textile-backend-jhm4.onrender.com/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        Invoice_No: customerMeta.Invoice_No,
                        Customer_name: customerMeta.Customer_name,
                        Company_Name: customerMeta.Company_Name,
                        Address: customerMeta.Address,
                        State: customerMeta.State,
                        State_Code: customerMeta.State_Code,
                        GSTIN_NO: customerMeta.GSTIN_NO,
                        Phone_no: customerMeta.Phone_no,
                        Product_Name: item.Product_Name, // 🚀 This will now contain the 'lable' value string
                        HSN_Code: item.HSN_Code,
                        QTY: item.QTY,
                        Size: item.Size,
                        Rate: item.Rate,
                        Discount: item.Discount
                    })
                });
            });

            await Promise.all(savePromises);
            message.success(`Daily Order Booked Successfully! Invoice No: ${customerMeta.Invoice_No}`);
            
            form.resetFields();
            setOrderItems([{ id: Date.now(), Product_Name: '', HSN_Code: '', QTY: 1, Size: '', Rate: 0, Amount: 0, Discount: 0 }]);
            loadPortalData(); 
        } catch (err) {
            message.error("Validation error or server node connection timeout.");
        } finally {
            setLoading(false);
        }
    };

    const markAsCompleted = async (invoiceNo) => {
        try {
            const res = await fetch(`https://textile-backend-jhm4.onrender.com/api/orders/complete/${encodeURIComponent(invoiceNo)}`, {
                method: 'PUT'
            });
            const data = await res.json();
            if (data.success) {
                message.success("Order processed and shifted to Completed archives!");
                loadPortalData(); 
            }
        } catch (err) {
            message.error("Failed to connect to backend server.");
        }
    };

    const deleteOrderBundle = async (invoiceNo) => {
        try {
            const res = await fetch(`https://textile-backend-jhm4.onrender.com/api/orders/${encodeURIComponent(invoiceNo)}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                message.success("Order history record successfully deleted!");
                loadPortalData(); 
            }
        } catch (err) {
            message.error("Failed to delete order entry from system registry.");
        }
    };

    const handleEditOrderClick = (record) => {
        setEditingInvoiceNo(record.Invoice_No);
        const itemsWithMeta = record.Ordered_Products.map((p, idx) => ({
            ...p,
            rowId: Date.now() + idx,
            Customer_name: record.Customer_name,
            Company_Name: record.Company_Name,
            Address: record.Address,
            State: record.State,
            State_Code: record.State_Code,
            GSTIN_NO: record.GSTIN_NO,
            Phone_no: record.Phone_no
        }));
        setEditOrderItems(itemsWithMeta);
        setIsEditModalVisible(true);
    };

    const handleEditRowChange = (index, field, value) => {
        const updated = [...editOrderItems];
        updated[index][field] = value;
        updated[index].Amount = Number(updated[index].QTY || 0) * Number(updated[index].Rate || 0);
        setEditOrderItems(updated);
    };

    const handleSaveEditedOrder = async () => {
        try {
            const res = await fetch(`https://textile-backend-jhm4.onrender.com/api/orders/${encodeURIComponent(editingInvoiceNo)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: editOrderItems })
            });
            const data = await res.json();
            if (data.success) {
                message.success("Order changes saved successfully!");
                setIsEditModalVisible(false);
                loadPortalData(); 
            }
        } catch (err) {
            message.error("Failed to commit edit updates.");
        }
    };

    const baseColumns = [
        { title: 'Invoice No', dataIndex: 'Invoice_No', key: 'Invoice_No', render: text => <strong style={{ color: '#1890ff' }}>{text}</strong> },
        { title: 'Customer Name', dataIndex: 'Customer_name', key: 'Customer_name' },
        { title: 'Company / Brand', dataIndex: 'Company_Name', key: 'Company_Name' },
        { title: 'Destination State', dataIndex: 'State', key: 'State' },
        { title: 'Items Booked', dataIndex: 'Ordered_Products', key: 'items', render: arr => <Tag color="blue">{Array.isArray(arr) ? arr.length : 0} Items Listed</Tag> }
    ];

    const pendingColumns = [
        ...baseColumns,
        {
            title: 'Actions Workflow',
            key: 'action',
            width: 240,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Popconfirm title="Mark this entire order process as complete?" onConfirm={() => markAsCompleted(record.Invoice_No)} okText="Yes" cancelText="No">
                        <Button type="primary" size="small" icon={<CheckCircleOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', borderRadius: 0 }}>Complete</Button>
                    </Popconfirm>
                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => handleEditOrderClick(record)} />
                    <Popconfirm title="Delete this active pending order layout?" onConfirm={() => deleteOrderBundle(record.Invoice_No)} okText="Delete" cancelText="No" okButtonProps={{ danger: true }}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const completedColumns = [
        ...baseColumns,
        {
            title: 'Action Status',
            key: 'delete_action',
            width: 160,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => handleEditOrderClick(record)} />
                    <Popconfirm title="Permanently clear this completed order row?" onConfirm={() => deleteOrderBundle(record.Invoice_No)} okText="Delete" cancelText="No" okButtonProps={{ danger: true }}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const expandedRowRender = (record) => {
        const nestedColumns = [
            { title: 'Label / Brand Name', dataIndex: 'Product_Name', key: 'Product_Name', render: t => <strong>{t}</strong> },
            { title: 'HSN Code', dataIndex: 'HSN_Code', key: 'HSN_Code' },
            { title: 'Size', dataIndex: 'Size', key: 'Size' },
            { title: 'Qty Ordered', dataIndex: 'QTY', key: 'QTY' },
            { title: 'Base Rate', dataIndex: 'Rate', key: 'Rate', render: r => `₹${Number(r).toFixed(2)}` },
            { title: 'Total Amount', dataIndex: 'Amount', key: 'Amount', render: a => `₹${Number(a).toFixed(2)}` },
            { title: 'Discount Price', dataIndex: 'Discount', key: 'Discount', render: d => `₹${Number(d).toFixed(2)}` }
        ];

        return (
            <Table
                columns={nestedColumns}
                dataSource={record.Ordered_Products}
                rowKey={(item) => item.Product_Name + item.Size + Math.random()}
                pagination={false}
                size="small"
                bordered
                style={{ background: '#fcfcfc', margin: '8px 0' }}
            />
        );
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={240}>
                <div className="sidebar-logo-container"><span className="sidebar-logo-text">Textiles</span></div>
                <Menu theme="dark" mode="inline" selectedKeys={['/orders']} onClick={(info) => navigate(info.key)} 
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
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Daily Orders 📃</span>
                </Header>

                <Content style={{ padding: '24px', background: '#f8fafc', overflowY: 'auto' }}>
                    <Form form={form} layout="vertical">
                        <Card title="Customer Profile" variant="borderless" style={{ marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <Space style={{ display: 'flex', flexWrap: 'wrap' }} align="start">
                                <Form.Item name="Invoice_No" label="Invoice No" rules={[{ required: true }]} style={{ width: '140px' }}><Input placeholder="e.g., INV-001" /></Form.Item>
                                <Form.Item name="Customer_name" label="Select Visited Customer" rules={[{ required: true }]} style={{ width: '200px' }}>
                                    <Select showSearch placeholder="Choose Client" onChange={handleCustomerSelect}>
                                        {customers.map(c => <Option key={c.Name} value={c.Name}>{c.Name}</Option>)}
                                    </Select>
                                </Form.Item>
                                <Form.Item name="Company_Name" label="Company Brand" style={{ width: '180px' }}><Input readOnly style={{ background: '#f5f5f5' }} /></Form.Item>
                                <Form.Item name="Address" label="Billing Destination Address" style={{ width: '220px' }}><Input readOnly style={{ background: '#f5f5f5' }} /></Form.Item>
                                <Form.Item name="State" label="Tax State jurisdiction" style={{ width: '150px' }}><Input readOnly style={{ background: '#f5f5f5' }} /></Form.Item>
                                <Form.Item name="State_Code" label="State Code" style={{ width: '90px' }}><Input readOnly style={{ background: '#f5f5f5' }} /></Form.Item>
                                <Form.Item name="GSTIN_NO" label="GSTIN Identification" style={{ width: '160px' }}><Input readOnly style={{ background: '#f5f5f5' }} /></Form.Item>
                            </Space>
                        </Card>

                        <Card title="Purchased Item" variant="borderless" style={{ marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} loading={loading}>
                            <table className="excel-ledger-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d9d9d9' }}>
                                <thead>
                                    <tr style={{ background: '#fafafa' }}>
                                        <th style={{ width: '5%', padding: '10px' }}>No</th>
                                        <th style={{ width: '30%', padding: '10px' }}>Select Label / Brand</th>
                                        <th style={{ width: '12%', padding: '10px' }}>HSN Code</th>
                                        <th style={{ width: '10%', padding: '10px' }}>QTY</th>
                                        <th style={{ width: '10%', padding: '10px' }}>Size</th>
                                        <th style={{ width: '12%', padding: '10px' }}>Base Rate</th>
                                        <th style={{ width: '15%', padding: '10px' }}>Gross Amount</th>
                                        <th style={{ width: '12%', padding: '10px' }}>Discount</th>
                                        <th style={{ width: '6%', padding: '10px', textAlign: 'center' }}>Del</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderItems.map((item, index) => (
                                        <tr key={item.id}>
                                            <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #d9d9d9' }}>{index + 1}</td>
                                            <td style={{ padding: '6px', border: '1px solid #d9d9d9' }}>
                                                <Select showSearch style={{ width: '100%' }} placeholder="Select product label brand" value={item.Product_Name || undefined} onChange={(val) => handleRowChange(index, 'Product_Name', val)}>
                                                    {/* 🚀 UPDATED: Maps product stock list drop downs dynamically using p.lable instead of item description */}
                                                    {products.map((p, idx) => <Option key={`${p.lable}-${idx}`} value={p.lable}>{p.lable}</Option>)}
                                                </Select>
                                            </td>
                                            <td style={{ padding: '6px', border: '1px solid #d9d9d9' }}><Input value={item.HSN_Code} readOnly style={{ background: '#f5f5f5' }} /></td>
                                            <td style={{ padding: '6px', border: '1px solid #d9d9d9' }}><InputNumber min={1} style={{ width: '100%' }} value={item.QTY} onChange={(val) => handleRowChange(index, 'QTY', val)} /></td>
                                            <td style={{ padding: '6px', border: '1px solid #d9d9d9' }}><Input value={item.Size} onChange={(e) => handleRowChange(index, 'Size', e.target.value)} /></td>
                                            <td style={{ padding: '6px', border: '1px solid #d9d9d9' }}><InputNumber min={0} style={{ width: '100%' }} value={item.Rate} onChange={(val) => handleRowChange(index, 'Rate', val)} /></td>
                                            <td style={{ padding: '6px', border: '1px solid #d9d9d9', fontWeight: 'bold' }}>₹{Number(item.Amount).toFixed(2)}</td>
                                            <td style={{ padding: '6px', border: '1px solid #d9d9d9' }}><InputNumber min={0} style={{ width: '100%' }} value={item.Discount} onChange={(val) => handleRowChange(index, 'Discount', val)} /></td>
                                            <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #d9d9d9' }}><Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeRow(index)} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Button type="dashed" icon={<OrderedListOutlined />} onClick={addRow} style={{ marginTop: '16px', width: '100%' }}>Add Another Item Row</Button>
                        </Card>

                        <div style={{ textAlign: 'right', marginBottom: '30px' }}>
                            <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSaveOrder} style={{ background: '#000000', borderColor: '#000000', padding: '0 36px', height: '44px', borderRadius: 0 }}>
                                Save Order Log to Daily Database
                            </Button>
                        </div>
                    </Form>

                    <Card title={<span><HistoryOutlined style={{ marginRight: '8px' }} /> Order Tracking</span>} variant="borderless" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <Tabs defaultActiveKey="1" items={[
                            {
                                key: '1',
                                label: <span style={{ fontWeight: '500' }}>Active Pending Orders ({pendingOrders.length})</span>,
                                children: (
                                    <Table 
                                        dataSource={pendingOrders} 
                                        columns={pendingColumns} 
                                        rowKey="Invoice_No" 
                                        size="small" 
                                        pagination={{ pageSize: 5 }} 
                                        expandable={{ expandedRowRender, defaultExpandAllRows: false }}
                                    />
                                )
                            },
                            {
                                key: '2',
                                label: <span style={{ fontWeight: '500' }}>Completed / Dispatched Archives ({completedOrders.length})</span>,
                                children: (
                                    <Table 
                                        dataSource={completedOrders} 
                                        columns={completedColumns} 
                                        rowKey="Invoice_No" 
                                        size="small" 
                                        pagination={{ pageSize: 5 }} 
                                        expandable={{ expandedRowRender, defaultExpandAllRows: false }}
                                    />
                                )
                            }
                        ]} />
                    </Card>
                </Content>
            </Layout>

            <Modal 
                title={`Modify Items Grid for Invoice: ${editingInvoiceNo}`} 
                open={isEditModalVisible} 
                onOk={handleSaveEditedOrder} 
                onCancel={() => setIsEditModalVisible(false)} 
                width={900}
                destroyOnClose 
                styles={{ body: { padding: '15px' } }}
            >
                <table className="excel-ledger-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d9d9d9', marginTop: '15px' }}>
                    <thead>
                        <tr style={{ background: '#fafafa' }}>
                            <th style={{ padding: '8px', border: '1px solid #d9d9d9' }}>Item Label Brand</th>
                            <th style={{ padding: '8px', border: '1px solid #d9d9d9', width: '15%' }}>Size</th>
                            <th style={{ padding: '8px', border: '1px solid #d9d9d9', width: '15%' }}>Qty</th>
                            <th style={{ padding: '8px', border: '1px solid #d9d9d9', width: '15%' }}>Rate</th>
                            <th style={{ padding: '8px', border: '1px solid #d9d9d9', width: '20%' }}>Gross Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {editOrderItems.map((item, idx) => (
                            <tr key={item.rowId || idx}>
                                <td style={{ padding: '6px', border: '1px solid #d9d9d9' }}><strong>{item.Product_Name}</strong></td>
                                <td style={{ padding: '6px', border: '1px solid #d9d9d9' }}><Input value={item.Size} onChange={(e) => handleEditRowChange(idx, 'Size', e.target.value)} /></td>
                                <td style={{ padding: '6px', border: '1px solid #d9d9d9' }}><InputNumber min={1} value={item.QTY} onChange={(val) => handleEditRowChange(idx, 'QTY', val)} style={{ width: '100%' }} /></td>
                                <td style={{ padding: '6px', border: '1px solid #d9d9d9' }}><InputNumber min={0} value={item.Rate} onChange={(val) => handleEditRowChange(idx, 'Rate', val)} style={{ width: '100%' }} /></td>
                                <td style={{ padding: '6px', border: '1px solid #d9d9d9', fontWeight: 'bold' }}>₹{Number(item.Amount || 0).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Modal>
        </Layout>
    );
}

export default OrderPage;