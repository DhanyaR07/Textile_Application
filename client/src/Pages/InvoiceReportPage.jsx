import React, { useState, useEffect } from 'react';
import { Layout, Menu, Table, Tag, Typography, Button, Modal, Space, Popconfirm, Form, Input, InputNumber, message } from 'antd';
import { DashboardOutlined, FileTextOutlined, ShoppingCartOutlined, UserOutlined, LogoutOutlined, PlusOutlined, BarChartOutlined, EyeOutlined, EditOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

// Helper function to convert numeric grand totals into text currency words safely
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

function InvoiceReportPage() {
    const navigate = useNavigate();
    const [invoiceForm] = Form.useForm();
    const [savedInvoices, setSavedInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    const [billModalVisible, setBillModalVisible] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [selectedBillItems, setSelectedBillItems] = useState([]);
    const [allRawOrders, setAllRawOrders] = useState([]);
    
    const [isEditInvoiceVisible, setIsEditInvoiceVisible] = useState(false);
    const [editingInvoiceNo, setEditingInvoiceNo] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const [orderRes, invRes] = await Promise.all([
                fetch('http://localhost:5001/api/orders-manifest'),
                fetch('http://localhost:5001/api/invoices-history')
            ]);
            const orderData = await orderRes.json();
            const invData = await invRes.json();

            if (invData.success) setSavedInvoices(invData.data || []);
            if (orderData.success) setAllRawOrders(orderData.data || []);
        } catch (err) {
            message.error("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const deleteInvoice = async (invoiceNo) => {
        try {
            const res = await fetch(`http://localhost:5001/api/invoices/${encodeURIComponent(invoiceNo)}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                message.success("Invoice statement deleted.");
                loadData();
            }
        } catch (err) {
            message.error("Failed to delete record.");
        }
    };

    const viewEntireBill = (invoiceRecord) => {
        const recordInvoiceNo = String(invoiceRecord?.Invoice_No || invoiceRecord?.invoice_no || '').trim();
        const matchedOrder = allRawOrders.find(o => {
            const orderInvoiceNo = String(o?.Invoice_No || o?.invoice_no || '').trim();
            return orderInvoiceNo === recordInvoiceNo;
        });

        setSelectedBill(invoiceRecord);
        setSelectedBillItems(matchedOrder ? (matchedOrder.Ordered_Products || matchedOrder.ordered_products || []) : []);
        setBillModalVisible(true);
    };

    const handleEditInvoiceClick = (record) => {
        setEditingInvoiceNo(record.Invoice_No || record.invoice_no);
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
            const res = await fetch('http://localhost:5001/api/invoices/save-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, invoice_no: editingInvoiceNo })
            });
            const data = await res.json();
            if (data.success) {
                message.success("Invoice updated successfully.");
                setIsEditInvoiceVisible(false);
                loadData();
            }
        } catch (err) {
            message.error("Validation failed.");
        }
    };

    // 🚀 FIXED: Added fallback render checks to capture both CamelCase and lowercase database variants
    const invoiceColumns = [
        { 
            title: 'Invoice No', 
            dataIndex: 'Invoice_No', 
            key: 'Invoice_No', 
            render: (t, r) => <strong style={{ color: '#1890ff' }}>{t || r.invoice_no}</strong> 
        },
        { 
            title: 'Customer Name', 
            dataIndex: 'Customer_Name', 
            key: 'Customer_Name', 
            render: (t, r) => t || r.customer_name || '—' 
        },
        { 
            title: 'Company Name', 
            dataIndex: 'Company_Name', 
            key: 'Company_Name', 
            render: (t, r) => t || r.company_name || '—' 
        },
        { 
            title: 'Invoice Date', 
            dataIndex: 'Invoice_Date', 
            key: 'Invoice_Date', 
            render: (d, r) => {
                const dateVal = d || r.invoice_date;
                return dateVal ? new Date(dateVal).toLocaleDateString('en-IN') : '—';
            }
        },
        { 
            title: 'Bale No', 
            dataIndex: 'Bale_No', 
            key: 'Bale_No', 
            render: (b, r) => { 
                const bn = b || r.bale_no; 
                return bn && bn !== '—' && bn !== '--' ? <Tag color="orange">{bn}</Tag> : '—'; 
            } 
        },
        { 
            title: 'Lorry Carrier', 
            key: 'Lorry_Name', 
            render: (_, record) => <span style={{ fontWeight: '500' }}>{record.Lorry_Name || record.lorry_name || '—'}</span> 
        },
        { 
            title: 'Net Total', 
            dataIndex: 'Net_Total', 
            key: 'Net_Total', 
            align: 'right', 
            render: (v, r) => <strong>₹{Number(v || r.net_total || 0).toFixed(2)}</strong> 
        },
        { 
            title: 'Actions Workflow', 
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

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={240}>
                <div className="sidebar-logo-container"><span className="sidebar-logo-text">Textiles</span></div>
                <Menu theme="dark" mode="inline" selectedKeys={['/reports/invoices']} defaultOpenKeys={['reports_submenu']} onClick={(info) => navigate(info.key)} inlineIndent={16} style={{ textAlign: 'left' }}
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
                    <Title level={4} style={{ margin: 0 }}>Saved Invoices Registry Portal 📑</Title>
                </Header>

                <Content style={{ padding: '24px', background: '#fff' }}>
                    <Table dataSource={savedInvoices} columns={invoiceColumns} rowKey={(record) => record.Invoice_No || record.invoice_no || record.id || Math.random()} size="small" loading={loading} bordered={false} pagination={{ pageSize: 10 }} />
                </Content>
            </Layout>

            <Modal title="Modify Invoice summary parameters" open={isEditInvoiceVisible} onOk={handleUpdateInvoiceSummary} onCancel={() => setIsEditInvoiceVisible(false)} destroyOnHidden>
                <Form form={invoiceForm} layout="vertical">
                    <Form.Item name="Customer_Name" label="Client Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="Company_Name" label="Company Brand Name"><Input /></Form.Item>
                    <Form.Item name="Bale_No" label="Bale Number"><Input /></Form.Item>
                    <Form.Item name="LR_No" label="LR Freight Number"><Input /></Form.Item>
                    <Form.Item name="Lorry_Name" label="Lorry Carrier Name"><Input /></Form.Item>
                    <Form.Item name="Total_Taxable" label="Taxable Value" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="Net_Total" label="Net Value Total" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item>
                </Form>
            </Modal>

            <Modal title={null} footer={null} open={billModalVisible} onCancel={() => setBillModalVisible(false)} width={850} centered styles={{ body: { padding: '20px' } }}>
                {selectedBill && (
                    <div id="printable-bill-invoice-node" style={{ color: '#000000', fontFamily: 'serif' }}>
                        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>
                            <Title level={3} style={{ margin: 0, fontWeight: 'bold', color: '#000', fontFamily: 'serif' }}>SRI BANUKRISHNA TEXTILES</Title>
                            <Text style={{ fontSize: '13px', display: 'block', color: '#000' }}>408/A, Anaikattu Road, Rajiv Nagar, Surampatti Valasu, Erode - 638009</Text>
                            <Text style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', color: '#000' }}>Prop: S.R. Krishnan &nbsp;|&nbsp; Mobile: 9443840784&nbsp;|&nbsp; GSTIN: 33AIUPK8316R3ZB</Text>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px', marginBottom: '12px' }}>
                            <tbody>
                                <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #000' }}>
                                    <th style={{ padding: '6px 8px', textAlign: 'left', width: '50%', color: '#000' }}>DETAILS OF RECEIVER (BILLED TO)</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'left', width: '50%', color: '#000' }}>LOGISTICS SUMMARY</th>
                                </tr>
                                <tr>
                                    <td style={{ padding: '8px', borderRight: '1px solid #000', verticalAlign: 'top', lineHeight: '1.6', color: '#000' }}>
                                        <strong>Receiver Name:</strong> {selectedBill.Customer_Name || selectedBill.customer_name || '—'}<br />
                                        <strong>Address:</strong> {selectedBill.Company_Name || selectedBill.company_name || selectedBill.Address || selectedBill.address || '—'}
                                    </td>
                                    <td style={{ padding: '8px', verticalAlign: 'top', lineHeight: '1.6', color: '#000' }}>
                                        <strong>Invoice No:</strong> <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{selectedBill.Invoice_No || selectedBill.invoice_no || '—'}</span><br />
                                        <strong>Date:</strong> {selectedBill.Invoice_Date || selectedBill.invoice_date ? new Date(selectedBill.Invoice_Date || selectedBill.invoice_date).toLocaleDateString('en-IN') : '—'}<br />
                                        <strong>BALE No:</strong> {selectedBill.Bale_No || selectedBill.bale_no || '—'} &nbsp;|&nbsp; <strong>LR No:</strong> {selectedBill.LR_No || selectedBill.lr_no || '—'}<br />
                                        <strong>Lorry:</strong> {selectedBill.Lorry_Name || selectedBill.lorry_name || '—'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px', marginBottom: '12px' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #000' }}>
                                    <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', width: '5%', color: '#000' }}>No</th>
                                    <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'left', width: '45%', color: '#000' }}>Product Details</th>
                                    <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', width: '15%', color: '#000' }}>HSN Code</th>
                                    <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', width: '10%', color: '#000' }}>QTY</th>
                                    <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', width: '10%', color: '#000' }}>Size</th>
                                    <th style={{ padding: '6px', textAlign: 'right', width: '15%', color: '#000' }}>Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedBillItems && selectedBillItems.length > 0 ? (
                                    selectedBillItems.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px dashed #ddd' }}>
                                            <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', color: '#000' }}>{idx + 1}</td>
                                            <td style={{ borderRight: '1px solid #000', padding: '6px', color: '#000' }}><strong>{item.Product_Name || item.product_name}</strong></td>
                                            <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', color: '#000' }}>{item.HSN_Code || item.hsn_code || '—'}</td>
                                            <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', color: '#000' }}>{item.QTY || item.qty}</td>
                                            <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', color: '#000' }}>{item.Size || item.size || '—'}</td>
                                            <td style={{ padding: '6px', textAlign: 'right', color: '#000' }}>₹{Number(item.Rate || item.rate || 0).toFixed(2)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                                            No matching item definitions discovered inside completion logs.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr', gap: '15px', border: '1px solid #000', fontSize: '12px', padding: '8px', marginBottom: '15px' }}>
                            <div>
                                <div style={{ marginBottom: '8px', color: '#000' }}>
                                    <strong>Amount Chargeable (in words):</strong><br />
                                    <span style={{ textTransform: 'uppercase', fontStyle: 'italic', fontSize: '11px', fontWeight: 'bold' }}>
                                        Rupees {convertNumberToWords(selectedBill.Net_Total || selectedBill.net_total)}
                                    </span>
                                </div>
                                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', borderTop: '1px solid #000', paddingTop: '4px' }}>
                                    <tbody>
                                        <tr style={{ color: '#000' }}><td><strong>CUB Account:</strong> 059109000018565</td><td><strong>IFSC:</strong> CIUB0000306</td></tr>
                                        <tr style={{ color: '#000' }}><td><strong>PNB Account:</strong> 0165002100045817</td><td><strong>IFSC:</strong> PUNB0016500</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ borderLeft: '1px solid #000', paddingLeft: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', color: '#000' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Total Taxable Value:</span>
                                    <span>₹{Number(selectedBill.Total_Taxable || selectedBill.total_taxable || 0).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', paddingTop: '4px', borderTop: '1px solid #ddd' }}>
                                    <span>Net Grand Total:</span>
                                    <span style={{ color: '#52c41a' }}>₹{Number(selectedBill.Net_Total || selectedBill.net_total || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

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

export default InvoiceReportPage;