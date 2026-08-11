import React, { useState, useEffect } from 'react';
import { Layout, Menu, Table, Tag, Typography, Button, Modal, Space, Popconfirm, Form, Input, InputNumber, message } from 'antd';
import { DashboardOutlined, FileTextOutlined, ShoppingCartOutlined, UserOutlined, LogoutOutlined, PlusOutlined, BarChartOutlined, EyeOutlined, EditOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const convertNumberToWords = (num) => {
    if (!num) return 'Zero Only';
    let safeNum = Math.round(Number(num));
    if (isNaN(safeNum)) return 'Zero Only';
    
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if ((safeNum = safeNum.toString()).length > 9) return 'overflow';
    let n = ('000000000' + safeNum).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += n[5] != 0 ? ((str != '' ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only ') : 'Only';
    return str;
};

function ReportPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [invoiceForm] = Form.useForm();
    
    const [savedInvoices, setSavedInvoices] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [allRawOrders, setAllRawOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Bill Modal State Management
    const [billModalVisible, setBillModalVisible] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [selectedBillItems, setSelectedBillItems] = useState([]);
    const [isEditInvoiceVisible, setIsEditInvoiceVisible] = useState(false);
    const [editingInvoiceNo, setEditingInvoiceNo] = useState('');

    const isOrdersView = location.pathname.includes('/reports/orders');

    const loadReportData = async () => {
        try {
            setLoading(true);
            const [orderRes, invRes] = await Promise.all([
                fetch('https://textile-backend-jhm4.onrender.com/api/orders-manifest'),
                fetch('https://textile-backend-jhm4.onrender.com/api/invoices-history')
            ]);
            const orderData = await orderRes.json();
            const invData = await invRes.json();

            if (invData.success) setSavedInvoices(invData.data || []);
            if (orderData.success) {
                const allOrders = orderData.data || [];
                setAllRawOrders(allOrders);
                setCompletedOrders(allOrders.filter(o => o.Ordered_Products && o.Ordered_Products[0]?.Order_Status === 'COMPLETED'));
            }
        } catch (err) {
            message.error("Failed to sync historical databases.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadReportData(); }, []);

    const deleteInvoice = async (invoiceNo) => {
        try {
            const res = await fetch(`https://textile-backend-jhm4.onrender.com/api/invoices/${encodeURIComponent(invoiceNo)}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                message.success("Invoice statement deleted.");
                loadReportData();
            }
        } catch (err) {
            message.error("Deletion call timed out.");
        }
    };

    const deleteOrderBundle = async (invoiceNo) => {
        try {
            const res = await fetch(`https://textile-backend-jhm4.onrender.com/api/orders/${encodeURIComponent(invoiceNo)}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                message.success("Order file record deleted.");
                loadReportData();
            }
        } catch (err) {
            message.error("Failed to delete order target profile.");
        }
    };

    const handleEditInvoiceClick = (record) => {
        const invNo = record.Invoice_No || record.invoice_no;
        setEditingInvoiceNo(invNo);
        invoiceForm.setFieldsValue({
            ...record,
            Customer_Name: record.Customer_Name || record.customer_name || '',
            Company_Name: record.Company_Name || record.company_name || '',
            Bale_No: record.Bale_No || record.bale_no || '',
            LR_No: record.LR_No || record.lr_no || '',
            Lorry_Name: record.Lorry_Name || record.lorry_name || '',
            Total_Taxable: record.Total_Taxable || record.total_taxable || 0,
            Net_Total: record.Net_Total || record.net_total || 0
        });
        setIsEditInvoiceVisible(true);
    };

    const handleUpdateInvoiceSummary = async () => {
        try {
            const values = await invoiceForm.validateFields();
            const res = await fetch('https://textile-backend-jhm4.onrender.com/api/invoices/save-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, invoice_no: editingInvoiceNo })
            });
            const data = await res.json();
            if (data.success) {
                message.success("Invoice details updated cleanly!");
                setIsEditInvoiceVisible(false);
                loadReportData();
            }
        } catch (err) {
            message.error("Validation failed.");
        }
    };

    const viewEntireBill = async (invoiceRecord) => {
        const targetInvoiceNo = String(invoiceRecord?.Invoice_No || invoiceRecord?.invoice_no || '').trim();

        try {
            const res = await fetch(`https://textile-backend-jhm4.onrender.com/api/invoices/details/${encodeURIComponent(targetInvoiceNo)}`);
            const result = await res.json();

            if (result.success) {
                const fetchedData = result.data;
                setSelectedBill(fetchedData);
                setSelectedBillItems(fetchedData.items || []);
            } else {
                const matchedOrder = allRawOrders.find(o => String(o?.Invoice_No || '').trim() === targetInvoiceNo);
                setSelectedBill({ ...matchedOrder, ...invoiceRecord });
                setSelectedBillItems(matchedOrder ? matchedOrder.Ordered_Products : []);
            }
        } catch (err) {
            const matchedOrder = allRawOrders.find(o => String(o?.Invoice_No || '').trim() === targetInvoiceNo);
            setSelectedBill({ ...matchedOrder, ...invoiceRecord });
            setSelectedBillItems(matchedOrder ? matchedOrder.Ordered_Products : []);
        }

        setBillModalVisible(true);
    };

    // 🚀 SUB-TABLE FOR EXPANDABLE ORDER ROW (`+` ICON)
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

    const invoiceColumns = [
        { 
            title: 'Company Name ID', 
            dataIndex: 'Invoice_No', 
            key: 'Invoice_No', 
            render: (t, r) => <strong style={{ color: '#1890ff' }}>{t || r.invoice_no}</strong> 
        },
        { 
            title: 'Company Name', 
            dataIndex: 'Company_Name', 
            key: 'Company_Name', 
            render: (t, r) => <strong>{t || r.company_name || r.Customer_Name || r.customer_name || '—'}</strong> 
        },
        { 
            title: 'Actions', 
            key: 'action', 
            align: 'center', 
            width: 220, 
            render: (_, record) => (
                <Space size="small">
                    <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => viewEntireBill(record)} style={{ borderRadius: 0, background: '#000', borderColor: '#000' }}>View</Button>
                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => handleEditInvoiceClick(record)} />
                    <Popconfirm title="Delete this invoice?" onConfirm={() => deleteInvoice(record.Invoice_No || record.invoice_no)} okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

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
            key: 'ops', 
            align: 'center',
            width: 100,
            render: (_, rec) => (
                <Popconfirm title="Delete order history?" onConfirm={() => deleteOrderBundle(rec.Invoice_No)} okButtonProps={{ danger: true }}>
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            )
        }
    ];

    const computedTaxableSum = selectedBillItems.reduce((acc, item) => {
        const qty = Number(item.QTY || item.qty || 0);
        const rate = Number(item.Rate || item.rate || 0);
        const disc = Number(item.Discount || item.discount || 0);
        return acc + Math.max(0, (qty * rate) - disc);
    }, 0);

    const activeTaxable = Number(selectedBill?.Total_Taxable || selectedBill?.total_taxable || computedTaxableSum);
    const activeNetTotal = Number(selectedBill?.Net_Total || selectedBill?.net_total || Math.round(activeTaxable * 1.05));
    const isLocalState = String(selectedBill?.State || selectedBill?.state || 'TAMIL NADU').toUpperCase() === 'TAMIL NADU';
    
    const cgstVal = isLocalState ? activeTaxable * 0.025 : 0;
    const sgstVal = isLocalState ? activeTaxable * 0.025 : 0;
    const igstVal = !isLocalState ? activeTaxable * 0.05 : 0;

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={240}>
                <div className="sidebar-logo-container"><span className="sidebar-logo-text">Textiles</span></div>
                <Menu 
                    theme="dark" 
                    mode="inline" 
                    selectedKeys={[location.pathname]} 
                    defaultOpenKeys={['reports_submenu']} 
                    onClick={(info) => navigate(info.key)} 
                    inlineIndent={16} 
                    style={{ textAlign: 'left' }}
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
                    <Title level={4} style={{ margin: 0 }}>
                        {isOrdersView ? 'Saved Orders Registry Portal 📦' : 'Saved Invoices Registry Portal 📑'}
                    </Title>
                </Header>

                <Content style={{ padding: '24px', background: '#fff', overflowY: 'auto' }}>
                    {isOrdersView ? (
                        /* 🚀 EXPANDABLE CONFIGURATION ENABLED WITH '+' ICON */
                        <Table 
                            dataSource={completedOrders} 
                            columns={orderColumns} 
                            rowKey="Invoice_No" 
                            size="small" 
                            loading={loading} 
                            bordered={false} 
                            pagination={{ pageSize: 10 }} 
                            expandable={{
                                expandedRowRender: (rec) => renderPurchasedItemsSubTable(rec.Ordered_Products),
                                defaultExpandAllRows: false
                            }}
                        />
                    ) : (
                        <Table 
                            dataSource={savedInvoices} 
                            columns={invoiceColumns} 
                            rowKey={(r) => r.Invoice_No || r.invoice_no || Math.random()} 
                            size="small" 
                            loading={loading} 
                            bordered={false} 
                            pagination={{ pageSize: 10 }} 
                        />
                    )}
                </Content>
            </Layout>

            {/* EDIT INVOICE MODAL */}
            <Modal title="Modify Invoice Summary Parameters" open={isEditInvoiceVisible} onOk={handleUpdateInvoiceSummary} onCancel={() => setIsEditInvoiceVisible(false)} destroyOnHidden>
                <Form form={invoiceForm} layout="vertical">
                    <Form.Item name="Customer_Name" label="Client Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="Company_Name" label="Company Brand Name"><Input /></Form.Item>
                    <Form.Item name="Bale_No" label="Bale Number"><Input placeholder="e.g. 12/A" /></Form.Item>
                    <Form.Item name="LR_No" label="LR Freight Number"><Input placeholder="e.g. LR-9988" /></Form.Item>
                    <Form.Item name="Lorry_Name" label="Lorry Carrier Name"><Input placeholder="e.g. VRL Logistics" /></Form.Item>
                    <Form.Item name="Total_Taxable" label="Taxable Value" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="Net_Total" label="Net Value Total" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item>
                </Form>
            </Modal>

            {/* FULL INVOICE VIEW POPUP MODAL */}
            <Modal title={null} footer={null} open={billModalVisible} onCancel={() => setBillModalVisible(false)} width={850} centered styles={{ body: { padding: '20px' } }}>
                {selectedBill && (
                    <div id="printable-bill-invoice-node" style={{ color: '#000000', fontFamily: 'serif' }}>
                        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>
                            <Title level={3} style={{ margin: 0, fontWeight: 'bold', color: '#000', fontFamily: 'serif' }}>SRI BANUKRISHNA TEXTILES</Title>
                            <Text style={{ fontSize: '13px', display: 'block', color: '#000' }}>408/A, Anaikattu Road, Rajiv Nagar, Surampatti Valasu, Erode - 638009</Text>
                            <Text style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', color: '#000' }}>Prop: S.R. Krishnan &nbsp;|&nbsp; Mobile: 9443840784 / 9486153380 &nbsp;|&nbsp; GSTIN: 33AIUPK8316R3ZB</Text>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px', marginBottom: '12px' }}>
                            <tbody>
                                <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #000' }}>
                                    <th style={{ padding: '6px 8px', textAlign: 'left', width: '50%', color: '#000' }}>DETAILS OF RECEIVER (BILLED TO)</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'left', width: '50%', color: '#000' }}>LOGISTICS SUMMARY</th>
                                </tr>
                                <tr>
                                    <td style={{ padding: '8px', borderRight: '1px solid #000', verticalAlign: 'top', lineHeight: '1.6', color: '#000' }}>
                                        <strong>Company Name:</strong> {selectedBill.Company_Name || '—'}<br />
                                        <strong>Receiver Name:</strong> {selectedBill.Customer_Name || '—'}<br />
                                        <strong>Address:</strong> {selectedBill.Address || '—'}
                                    </td>
                                    <td style={{ padding: '8px', verticalAlign: 'top', lineHeight: '1.6', color: '#000' }}>
                                        <strong>Invoice No:</strong> <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{selectedBill.Invoice_No || selectedBill.invoice_no || '—'}</span><br />
                                        <strong>Date:</strong> {selectedBill.Invoice_Date || selectedBill.invoice_date ? new Date(selectedBill.Invoice_Date || selectedBill.invoice_date).toLocaleDateString('en-IN') : '—'}<br />
                                        <strong>BALE No:</strong> {selectedBill.Bale_No || selectedBill.bale_no || '—'} &nbsp;|&nbsp; <strong>LR No:</strong> {selectedBill.LR_No || selectedBill.lr_no || '—'}<br />
                                        <strong>Lorry Carrier:</strong> {selectedBill.Lorry_Name || selectedBill.lorry_name || '—'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px', marginBottom: '12px' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #000' }}>
                                    <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', width: '5%', color: '#000' }}>No</th>
                                    <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'left', width: '35%', color: '#000' }}>Product Details</th>
                                    <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', width: '12%', color: '#000' }}>HSN Code</th>
                                    <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', width: '8%', color: '#000' }}>QTY</th>
                                    <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', width: '10%', color: '#000' }}>Size</th>
                                    <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right', width: '12%', color: '#000' }}>Rate</th>
                                    <th style={{ padding: '6px', textAlign: 'right', width: '18%', color: '#000' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedBillItems && selectedBillItems.length > 0 ? (
                                    selectedBillItems.map((item, idx) => {
                                        const qty = Number(item.QTY || item.qty || 1);
                                        const rate = Number(item.Rate || item.rate || 0);
                                        const amt = qty * rate;
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px dashed #ddd' }}>
                                                <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', color: '#000' }}>{idx + 1}</td>
                                                <td style={{ borderRight: '1px solid #000', padding: '6px', color: '#000' }}><strong>{item.Product_Name || item.product_name}</strong></td>
                                                <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', color: '#000' }}>{item.HSN_Code || item.hsn_code || '—'}</td>
                                                <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', color: '#000' }}>{qty}</td>
                                                <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', color: '#000' }}>{item.Size || item.size || '—'}</td>
                                                <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right', color: '#000' }}>₹{rate.toFixed(2)}</td>
                                                <td style={{ padding: '6px', textAlign: 'right', color: '#000', fontWeight: 'bold' }}>₹{amt.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '12px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                                            Full item details synchronized from order completion ledger.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11px', marginBottom: '15px' }}>
                            <tbody>
                                <tr>
                                    <td colSpan="6" style={{ padding: '6px 8px', fontWeight: 'bold', borderBottom: '1px solid #000', color: '#000' }}>
                                        Amount Chargeable (in words): <span style={{ textTransform: 'uppercase', fontStyle: 'italic', fontWeight: 'normal' }}>{convertNumberToWords(activeNetTotal)}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ width: '20%', padding: '4px 8px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Bank</td>
                                    <td style={{ width: '20%', padding: '4px 8px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Account No</td>
                                    <td style={{ width: '15%', padding: '4px 8px', borderRight: '1px solid #000', fontWeight: 'bold' }}>IFSC</td>
                                    <td style={{ width: '25%', padding: '4px 8px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Taxable Value</td>
                                    <td style={{ width: '20%', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹{activeTaxable.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>CITY UNION BANK</td>
                                    <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>059109000018565</td>
                                    <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>CIUB0000306</td>
                                    <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>Total CGST (2.50%)</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>₹{cgstVal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>PUNJAB NATIONAL BANK</td>
                                    <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>0165002100045817</td>
                                    <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>PUNB0016500</td>
                                    <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>Total SGST (2.50%)</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>₹{sgstVal.toFixed(2)}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #000' }}>
                                    <td colSpan="3" style={{ borderRight: '1px solid #000' }}></td>
                                    <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>Total IGST (5.00%)</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>₹{igstVal.toFixed(2)}</td>
                                </tr>
                                <tr style={{ fontSize: '13px', fontWeight: 'bold', background: '#fafafa' }}>
                                    <td colSpan="3" style={{ borderRight: '1px solid #000', padding: '6px 8px' }}>
                                        Declaration: Goods once sold cannot be taken back.
                                    </td>
                                    <td style={{ padding: '6px 8px', borderRight: '1px solid #000' }}>Net Grand Total</td>
                                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#52c41a' }}>₹{activeNetTotal.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div style={{ textAlign: 'right', marginTop: '15px' }} className="no-print">
                            <Space>
                                <Button onClick={() => setBillModalVisible(false)}>Close Preview</Button>
                                <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ background: '#000', borderColor: '#000', borderRadius: 0 }}>
                                    Print Bill Sheet
                                </Button>
                            </Space>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}

export default ReportPage;