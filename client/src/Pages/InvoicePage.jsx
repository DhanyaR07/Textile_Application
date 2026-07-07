import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Form, Input, InputNumber, Table, Select, Drawer, message } from 'antd';
import { DashboardOutlined, FileTextOutlined, ShoppingCartOutlined, UserOutlined, LogoutOutlined, HistoryOutlined, PrinterOutlined, PlusOutlined, DeleteOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../StyleSheet/InvoicePage.css';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

// Helper function to generate an array of fixed blank rows
const createFixedBlankRows = (count) => {
    return Array.from({ length: count }, (_, idx) => ({
        id: `fixed-row-${Date.now()}-${idx}`,
        product_name: '',
        hsn_code: '',
        qty: null,
        size: '',
        rate: null,
        amount: 0,
        discount: null,
        taxable: 0,
        cgst_p: 2.5,
        sgst_p: 2.5,
        igst_p: 5.0
    }));
};

const convertNumberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (!num) return 'Zero Only';
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += n[5] != 0 ? ((str != '' ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only ') : 'Only';
    return str;
};

function InvoicePage() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [drawerVisible, setDrawerVisible] = useState(false);

    const [companyData, setCompanyData] = useState({
        company_name: 'SRI BANUKRISHNA TEXTILES',
        address: '408/A, Anaikattu Road, Rajiv Nagar, Surampatti Valasu, Erode - 638009',
        proprietor: 'S.R. Krishnan',
        mobile: '9443840784 / 9486153380',
        gstin: '33AIUPK8316R3ZB'
    });

    const [bankData, setBankData] = useState({
        bank1_name: 'CITY UNION BANK', bank1_ac: '059109000018565', bank1_ifsc: 'CIUB0000306'
    });

    const [bankData2, setBankData2] = useState({
        bank2_name: 'PUNJAB NATIONAL BANK', bank2_ac: '0165002100045817', bank2_ifsc: 'PUNB0016500'
    });

    const [headerData, setHeaderData] = useState({
        receiver_name: '', address: '', state: '', state_code: '', gstin_no: '', invoice_no: '', date: '', lr_no: '', bale_no: '',
        lorry_name: '', through: ''
    });

    // 🚀 EXCEL PRE-FILL ARCHITECTURE: Standardize on an initial layout structure of 10 static rows
    const [items, setItems] = useState(createFixedBlankRows(10));
    const [totals, setTotals] = useState({ taxableSum: 0, cgst: 0, sgst: 0, igst: 0, netTotal: 0 });

    const fetchAllPortalRecords = async () => {
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
            
            if (prodData.success) setProducts(prodData.data || []);
            if (custData.success) setCustomers(custData.data || []);
            if (orderData.success) setOrders(orderData.data || []);
        } catch (err) {
            console.error("Sync loop fail", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchAllPortalRecords(); 
        const today = new Date().toISOString().split('T')[0];
        setHeaderData(prev => ({ ...prev, date: today }));
    }, []);

    useEffect(() => { form.setFieldsValue({ ...companyData, ...bankData, ...bankData2 }); }, [form, companyData, bankData, bankData2]);

    const recalcTotals = (currentItems) => {
        let taxableSum = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0;
        currentItems.forEach(item => {
            if (item.product_name) { // Only aggregate calculations for populated rows
                taxableSum += (item.taxable || 0);
                totalCgst += item.taxable * (Number(item.cgst_p || 0) / 100);
                totalSgst += item.taxable * (Number(item.sgst_p || 0) / 100);
                totalIgst += item.taxable * (Number(item.igst_p || 0) / 100);
            }
        });
        setTotals({ taxableSum, cgst: totalCgst, sgst: totalSgst, igst: totalIgst, netTotal: Math.round(taxableSum + totalCgst + totalSgst + totalIgst) });
    };

    const handleRowChange = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] = value;
        
        if (field === 'product_name') {
            const matched = products.find(p => p.Products === value);
            if (matched) {
                updatedItems[index].hsn_code = matched.HSN_Code || '';
                updatedItems[index].size = matched.Size || '';
                updatedItems[index].rate = Number(matched.Rate || 0);
                updatedItems[index].discount = Number(matched.Discount || 0);
                updatedItems[index].qty = 1;
            } else if (!value) {
                // If row content is completely cleared, restore it to a clean blank state
                updatedItems[index].hsn_code = '';
                updatedItems[index].size = '';
                updatedItems[index].rate = null;
                updatedItems[index].discount = null;
                updatedItems[index].qty = null;
                updatedItems[index].amount = 0;
                updatedItems[index].taxable = 0;
            }
        }
        
        const qty = Number(updatedItems[index].qty || 0);
        const rate = Number(updatedItems[index].rate || 0);
        const discount = Number(updatedItems[index].discount || 0);
        
        updatedItems[index].amount = qty * rate;
        updatedItems[index].taxable = Math.max(0, (qty * rate) - discount);
        
        setItems(updatedItems);
        recalcTotals(updatedItems);
    };

    const handleCompanyChange = (field, value) => setCompanyData(prev => ({ ...prev, [field]: value }));
    const handleHeaderChange = (field, value) => setHeaderData(prev => ({ ...prev, [field]: value }));
    
    // 🚀 LOAD ORDER INLINE REPLACEMENT MATRIX
    const selectOrderBundle = (selectedOrder) => {
        const matchedCustomer = customers.find(c => c.Name === selectedOrder.Customer_name);
        const resolvedCompanyName = matchedCustomer?.Company_Name || selectedOrder.Company_Name || '';

        const profile = {
            receiver_name: selectedOrder.Customer_name || '',
            address: selectedOrder.Address || '',
            state: selectedOrder.State || 'TAMIL NADU',
            state_code: String(selectedOrder.State_Code || '33').trim(),
            gstin_no: selectedOrder.GSTIN_NO || '',
            invoice_no: selectedOrder.Invoice_No || '',
            lorry_name: selectedOrder.Lorry_Name || selectedOrder.lorry_name || '',
            through: selectedOrder.Through || selectedOrder.through || ''
        };
        
        setHeaderData(prev => ({ ...prev, ...profile }));
        form.setFieldsValue({ ...profile, Company_Name: resolvedCompanyName });

        if (selectedOrder.Ordered_Products && Array.isArray(selectedOrder.Ordered_Products)) {
            // Re-map incoming items directly into our fixed matrix array structure
            const baseMatrix = createFixedBlankRows(Math.max(10, selectedOrder.Ordered_Products.length));
            
            selectedOrder.Ordered_Products.forEach((ordProd, idx) => {
                const amt = Number(ordProd.QTY || 0) * Number(ordProd.Rate || 0);
                baseMatrix[idx] = {
                    id: `loaded-row-${Date.now()}-${idx}`,
                    product_name: ordProd.Product_Name,
                    hsn_code: ordProd.HSN_Code || '',
                    qty: Number(ordProd.QTY || 1),
                    size: ordProd.Size || '',
                    rate: Number(ordProd.Rate || 0),
                    amount: amt,
                    discount: Number(ordProd.Discount || 0),
                    taxable: Math.max(0, amt - Number(ordProd.Discount || 0)),
                    cgst_p: Number(ordProd.CGST_Rate || 2.5),
                    sgst_p: Number(ordProd.SGST_Rate || 2.5),
                    igst_p: Number(ordProd.IGST_Rate || 5.0)
                };
            });
            
            setItems(baseMatrix);
            recalcTotals(baseMatrix);
        }
        setDrawerVisible(false);
    };

    const handleSaveDraft = async () => {
        if (!headerData.invoice_no) {
            message.error("Cannot save: Missing Invoice Number reference.");
            return;
        }

        try {
            // Filter down to rows containing actual data to keep database writes efficient
            const pureActiveItems = items.filter(item => item.product_name !== '');
            
            const payload = {
                invoice_no: headerData.invoice_no,
                receiver_name: headerData.receiver_name,
                company_name: form.getFieldValue('Company_Name') || '—',
                taxableSum: totals.taxableSum,
                netTotal: totals.netTotal,
                bale_no: headerData.bale_no,
                lr_no: headerData.lr_no,
                date: headerData.date,
                lorry_name: headerData.lorry_name,
                through: headerData.through,
                items: pureActiveItems
            };

            const res = await fetch('http://localhost:5001/api/invoices/save-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                message.success("Invoice records successfully saved to database!");
                fetchAllPortalRecords(); 
            }
        } catch (err) {
            message.error("Failed to connect to backend save endpoint.");
        }
    };

    const handleJustPrint = () => {
        window.print();
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Sider width={240} className="no-print" style={{ background: '#001529' }}>
                <div className="sidebar-logo-container"><span className="sidebar-logo-text">Textiles</span></div>
                <Menu theme="dark" mode="inline" selectedKeys={['/invoices']} defaultOpenKeys={['reports_submenu']} onClick={(info) => navigate(info.key)} inlineIndent={16} style={{ textAlign: 'left' }}
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
                    ]} 
                />
            </Sider>

            <Layout style={{ background: '#ffffff' }}>
                <Header className="no-print" style={{ background: '#ffffff', padding: '0 24px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #d9d9d9' }}>
                    <span style={{ fontSize: '16px' }}>Spreadsheet Entry Manifest</span>
                </Header>

                <Content className="print-container spreadsheet-container">
                    <div className="spreadsheet-branding-header">
                        <div style={{ display: 'inline-block', width: '100%', maxWidth: '700px' }}>
                            <span className="print-only-text-node" style={{ fontSize: '24px', fontWeight: 'bold', display: 'block', textAlign: 'center', marginBottom: '4px' }}>{companyData.company_name}</span>
                            <Input className="no-print" variant="borderless" style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#000000', width: '100%', padding: 0 }} value={companyData.company_name} onChange={(e) => handleCompanyChange('company_name', e.target.value)} />
                        </div>
                        <div style={{ display: 'inline-block', width: '100%', maxWidth: '800px', marginTop: '4px' }}>
                            <span className="print-only-text-node" style={{ fontSize: '13px', display: 'block', textAlign: 'center', marginBottom: '4px' }}>{companyData.address}</span>
                            <Input className="no-print" variant="borderless" style={{ textAlign: 'center', fontSize: '13px', color: '#000000', width: '100%', padding: 0 }} value={companyData.address} onChange={(e) => handleCompanyChange('address', e.target.value)} />
                        </div>
                        <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '4px', fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>
                            <span>Prop:</span>
                            <span className="print-only-text-node">{companyData.proprietor}</span>
                            <Input className="no-print" variant="borderless" style={{ width: '110px', fontSize: '12px', fontWeight: 'bold', padding: 0, color: '#000000' }} value={companyData.proprietor} onChange={(e) => handleCompanyChange('proprietor', e.target.value)} />
                            <span>| &nbsp; Mobile:</span>
                            <span className="print-only-text-node">{companyData.mobile}</span>
                            <Input className="no-print" variant="borderless" style={{ width: '180px', fontSize: '12px', fontWeight: 'bold', padding: 0, color: '#000000' }} value={companyData.mobile} onChange={(e) => handleCompanyChange('mobile', e.target.value)} />
                            <span>| &nbsp; GSTIN:</span>
                            <span className="print-only-text-node">{companyData.gstin}</span>
                            <Input className="no-print" variant="borderless" style={{ width: '140px', fontSize: '12px', fontWeight: 'bold', padding: 0, color: '#000000', textTransform: 'uppercase' }} value={companyData.gstin} onChange={(e) => handleCompanyChange('gstin', e.target.value)} />
                        </div>
                    </div>

                    <Form form={form} layout="inline" style={{ width: '100%' }}>
                        <table className="receiver-segment-block">
                            <thead>
                                <tr className="receiver-table-title-row">
                                    <th style={{ width: '50%', textTransform: 'uppercase', borderRight: '1px solid #000000' }}>DETAILS OF RECEIVER (BILLED TO)</th>
                                    <th style={{ width: '50%', textTransform: 'uppercase' }}>INVOICE DETAILS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '4px 12px', borderRight: '1px solid #000000' }}>
                                        <div className="receiver-cell-layout">
                                            <span className="receiver-cell-label" style={{ minWidth: '100px' }}>Name:</span>
                                            <div className="receiver-cell-content">
                                                <span className="print-only-text-node">{headerData.receiver_name || '—'}</span>
                                                <Input className="no-print" variant="borderless" style={{ padding: '4px 0', fontSize: '12px', width: '100%', color: '#000000', fontWeight: 'bold' }} placeholder="Enter Name" value={headerData.receiver_name} onChange={(e) => handleHeaderChange('receiver_name', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '4px 12px' }}>
                                        <div className="receiver-cell-layout">
                                            <span className="receiver-cell-label" style={{ minWidth: '100px' }}>Invoice No:</span>
                                            <div className="receiver-cell-content">
                                                <span className="print-only-text-node">{headerData.invoice_no || '—'}</span>
                                                <Input className="no-print" variant="borderless" style={{ padding: '4px 0', fontSize: '12px', width: '100%', color: '#000000', fontWeight: 'bold' }} placeholder="Invoice No" value={headerData.invoice_no} onChange={(e) => handleHeaderChange('invoice_no', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 12px', borderRight: '1px solid #000000', verticalAlign: 'top' }}>
                                        <div className="receiver-cell-layout" style={{ alignItems: 'flex-start' }}>
                                            <span className="receiver-cell-label" style={{ minWidth: '100px', marginTop: '6px' }}>Address:</span>
                                            <div className="receiver-cell-content">
                                                <span className="print-only-text-node" style={{ minHeight: '36px' }}>{headerData.address || '—'}</span>
                                                <Input.TextArea className="no-print" rows={2} variant="borderless" style={{ padding: '4px 0', fontSize: '12px', resize: 'none', width: '100%', color: '#000000' }} placeholder="Enter Address" value={headerData.address} onChange={(e) => handleHeaderChange('address', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ verticalAlign: 'top', padding: '4px 12px' }}>
                                        <div className="receiver-cell-layout">
                                            <span className="receiver-cell-label" style={{ minWidth: '100px' }}>Date:</span>
                                            <div className="receiver-cell-content">
                                                <span className="print-only-text-node">{headerData.date || '—'}</span>
                                                <Input className="no-print" type="date" variant="borderless" style={{ padding: '4px 0', fontSize: '12px', width: '100%', color: '#000000' }} value={headerData.date} onChange={(e) => handleHeaderChange('date', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 12px', borderRight: '1px solid #000000' }}>
                                        <div className="receiver-cell-layout">
                                            <span className="receiver-cell-label" style={{ minWidth: '100px' }}>State:</span>
                                            <div className="receiver-cell-content">
                                                <span className="print-only-text-node">{headerData.state || '—'}</span>
                                                <Input className="no-print" variant="borderless" placeholder="State" style={{ padding: '4px 0', fontSize: '12px', width: '100%', color: '#000000' }} value={headerData.state} onChange={(e) => handleHeaderChange('state', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '4px 12px' }}>
                                        <div className="receiver-cell-layout">
                                            <span className="receiver-cell-label" style={{ minWidth: '100px' }}>LR No:</span>
                                            <div className="receiver-cell-content">
                                                <span className="print-only-text-node">{headerData.lr_no || '—'}</span>
                                                <Input className="no-print" variant="borderless" style={{ padding: '4px 0', fontSize: '12px', width: '100%', color: '#000000' }} placeholder="LR No" value={headerData.lr_no} onChange={(e) => handleHeaderChange('lr_no', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 12px', borderRight: '1px solid #000000' }}>
                                        <div className="receiver-cell-layout">
                                            <span className="receiver-cell-label" style={{ minWidth: '100px' }}>State Code:</span>
                                            <div className="receiver-cell-content">
                                                <span className="print-only-text-node">{headerData.state_code || '—'}</span>
                                                <Input className="no-print" variant="borderless" placeholder="State Code" style={{ padding: '4px 0', fontSize: '12px', width: '100%', color: '#000000' }} value={headerData.state_code} onChange={(e) => handleHeaderChange('state_code', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '4px 12px' }}>
                                        <div className="receiver-cell-layout">
                                            <span className="receiver-cell-label" style={{ minWidth: '100px' }}>BALE No:</span>
                                            <div className="receiver-cell-content">
                                                <span className="print-only-text-node">{headerData.bale_no || '—'}</span>
                                                <Input className="no-print" variant="borderless" style={{ padding: '4px 0', fontSize: '12px', width: '100%', color: '#000000' }} placeholder="BALE No" value={headerData.bale_no} onChange={(e) => handleHeaderChange('bale_no', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 12px', borderRight: '1px solid #000000' }}>
                                        <div className="receiver-cell-layout">
                                            <span className="receiver-cell-label" style={{ minWidth: '100px' }}>GSTIN No:</span>
                                            <div className="receiver-cell-content">
                                                <span className="print-only-text-node">{headerData.gstin_no || '—'}</span>
                                                <Input className="no-print" variant="borderless" style={{ padding: '4px 0', fontSize: '12px', width: '100%', color: '#000000', textTransform: 'uppercase' }} placeholder="GSTIN No" value={headerData.gstin_no} onChange={(e) => handleHeaderChange('gstin_no', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '4px 12px' }}>
                                        <div className="receiver-cell-layout">
                                            <span className="receiver-cell-label" style={{ minWidth: '100px' }}>LORRY:</span>
                                            <div className="receiver-cell-content">
                                                <span className="print-only-text-node">{headerData.lorry_name || '—'}</span>
                                                <Input className="no-print" variant="borderless" style={{ padding: '4px 0', fontSize: '12px', width: '100%', color: '#000000', fontWeight: 'bold' }} placeholder="LORRY Carrier" value={headerData.lorry_name} onChange={(e) => handleHeaderChange('lorry_name', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 12px', borderRight: '1px solid #000000' }}>
                                        <div className="no-print" style={{ textAlign: 'left' }}>
                                            <Button type="primary" size="small" icon={<HistoryOutlined />} onClick={() => setDrawerVisible(true)} style={{ borderRadius: 0, fontSize: '11px' }}>Order Details Lookup</Button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '4px 12px' }}>
                                        <div className="receiver-cell-layout">
                                            <span className="receiver-cell-label" style={{ minWidth: '100px' }}>THROUGH:</span>
                                            <div className="receiver-cell-content">
                                                <span className="print-only-text-node">{headerData.through || '—'}</span>
                                                <Input className="no-print" variant="borderless" style={{ padding: '4px 0', fontSize: '12px', width: '100%', color: '#000000' }} placeholder="THROUGH Agent" value={headerData.through} onChange={(e) => handleHeaderChange('through', e.target.value)} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="excel-ledger-table-wrapper">
                            <table className="excel-ledger-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '5%', textAlign: 'center' }}>No</th>
                                        <th style={{ width: '30%' }}>Particulars</th>
                                        <th style={{ width: '10%', textAlign: 'center' }}>HSN Code</th>
                                        <th style={{ width: '8%', textAlign: 'center' }}>QTY</th>
                                        <th style={{ width: '8%', textAlign: 'center' }}>Size</th>
                                        <th style={{ width: '10%', textAlign: 'right' }}>Rate</th>
                                        <th style={{ width: '11%', textAlign: 'right' }}>Amount</th>
                                        <th style={{ width: '9%', textAlign: 'right' }}>Discount</th>
                                        <th style={{ width: '12%', textAlign: 'right' }}>Taxable Value</th>
                                        <th style={{ width: '50px', textAlign: 'center' }} className="no-print font-cell-label">Clear</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={item.id || index}>
                                            <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                            <td>
                                                <span className="print-only-text-node">{item.product_name || '—'}</span>
                                                <div className="no-print">
                                                    <Select showSearch allowClear variant="borderless" style={{ width: '100%', padding: 0 }} placeholder="Select Item Particular" value={item.product_name || undefined} onChange={(val) => handleRowChange(index, 'product_name', val)}>
                                                        {products.map((p, idx) => <Option key={`${p.Products}-${idx}`} value={p.Products}>{p.Products}</Option>)}
                                                    </Select>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center', background: '#f9f9f9', fontWeight: '500' }}>{item.hsn_code || '—'}</td>
                                            <td>
                                                <span className="print-only-text-node">{item.qty !== null ? item.qty : '—'}</span>
                                                <InputNumber className="no-print" min={1} variant="borderless" style={{ width: '100%', padding: 0, textAlign: 'center' }} value={item.qty} placeholder="—" onChange={(val) => handleRowChange(index, 'qty', val)} />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="print-only-text-node">{item.size || '—'}</span>
                                                <Input className="no-print" variant="borderless" style={{ padding: 0, textAlign: 'center' }} value={item.size} placeholder="—" onChange={(e) => handleRowChange(index, 'size', e.target.value)} />
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span className="print-only-text-node">{item.rate !== null ? `₹${Number(item.rate).toFixed(2)}` : '—'}</span>
                                                <InputNumber className="no-print" min={0} variant="borderless" style={{ width: '100%', padding: 0 }} value={item.rate} placeholder="—" onChange={(val) => handleRowChange(index, 'rate', val)} />
                                            </td>
                                            <td style={{ textAlign: 'right', background: '#f9f9f9', fontWeight: 'bold' }}>
                                                {item.product_name ? `₹${(item.amount || 0).toFixed(2)}` : '—'}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span className="print-only-text-node">{item.discount !== null ? `₹${Number(item.discount).toFixed(2)}` : '—'}</span>
                                                <InputNumber className="no-print" min={0} variant="borderless" style={{ width: '100%', padding: 0 }} value={item.discount} placeholder="—" onChange={(val) => handleRowChange(index, 'discount', val)} />
                                            </td>
                                            <td style={{ textAlign: 'right', background: '#f9f9f9', fontWeight: 'bold' }}>
                                                {item.product_name ? `₹${(item.taxable || 0).toFixed(2)}` : '—'}
                                            </td>
                                            <td style={{ textAlign: 'center' }} className="no-print">
                                                <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleRowChange(index, 'product_name', '')} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* 🚀 ADD EXTRA ROWS RETAINED SAFELY */}
                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => setItems([...items, ...createFixedBlankRows(1)])} style={{ marginBottom: '16px', width: '100%', borderRadius: 0, borderColor: '#000000', color: '#000000' }} className="no-print">Insert Extra Blank Row</Button>

                        <div style={{ width: '100%', marginTop: '20px' }}>
                            <table className="excel-footer-unified-table">
                                <tbody>
                                    <tr>
                                        <td colSpan="6" className="amount-words-banner-cell">
                                            <strong>Amount Chargeable (in words):</strong> 
                                            <span style={{ textTransform: 'uppercase', marginLeft: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                Rupees {convertNumberToWords(totals.netTotal)}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="3" rowSpan="2" style={{ background: '#ffffff', borderBottom: 'none' }}></td>
                                        <td colSpan="2" className="tax-totals-heading-cell">Total Taxable Value</td>
                                        <td className="tax-totals-value-cell">₹{totals.taxableSum.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="tax-totals-heading-cell">Total CGST</td>
                                        <td className="tax-rate-percentage-cell">2.50%</td>
                                        <td className="tax-totals-value-cell">₹{totals.cgst.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="bank-header-cell" style={{ width: '20%' }}>Bank</td>
                                        <td className="bank-header-cell" style={{ width: '18%' }}>Account No</td>
                                        <td className="bank-header-cell" style={{ width: '12%' }}>IFSC</td>
                                        <td className="tax-totals-heading-cell">Total SGST</td>
                                        <td className="tax-rate-percentage-cell">2.50%</td>
                                        <td className="tax-totals-value-cell">₹{totals.sgst.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="bank-data-cell">{bankData.bank1_name}</td>
                                        <td className="bank-data-cell">{bankData.bank1_ac}</td>
                                        <td className="bank-data-cell">{bankData.bank1_ifsc}</td>
                                        <td className="tax-totals-heading-cell">Total IGST</td>
                                        <td className="tax-rate-percentage-cell">5.00%</td>
                                        <td className="tax-totals-value-cell">₹{totals.igst.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="bank-data-cell">{bankData2.bank2_name}</td>
                                        <td className="bank-data-cell">{bankData2.bank2_ac}</td>
                                        <td className="bank-data-cell">{bankData2.bank2_ifsc}</td>
                                        <td className="tax-totals-heading-cell">Round Off</td>
                                        <td className="tax-rate-percentage-cell">—</td>
                                        <td className="tax-totals-value-cell">
                                            ₹{(totals.netTotal - (totals.taxableSum + totals.cgst + totals.sgst + totals.igst)).toFixed(2)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="3" rowSpan="2" className="declaration-terms-cell" style={{ verticalAlign: 'top' }}>
                                            <strong>Declaration / Terms:</strong><br />
                                            1) Good once sold cannot be taken back<br />
                                            2) Erode Jurisdiction only<br />
                                            3) Interest at 15% will be charged after 30 days
                                        </td>
                                        <td colSpan="2" className="net-total-heading-cell">Net Total</td>
                                        <td className="net-total-value-cell">₹{totals.netTotal.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="3" className="auth-signature-block-cell">
                                            <div className="auth-sign-wrapper">
                                                <span className="auth-company-title">For SRI BANUKRISHNA TEXTILES</span>
                                                <span className="auth-signature-line">Authorized signature</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="no-print" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <Button type="default" onClick={handleSaveDraft} style={{ borderColor: '#000000', color: '#000000', fontWeight: 'bold', borderRadius: 0, height: '38px', width: '150px' }}>Save Invoice</Button>
                                <Button type="primary" icon={<PrinterOutlined />} onClick={handleJustPrint} style={{ background: '#000000', borderColor: '#000000', color: '#ffffff', fontWeight: 'bold', borderRadius: 0, height: '38px', width: '150px' }}>Print Bill</Button>
                            </div>
                        </div>
                    </Form>
                </Content>
            </Layout>

            <Drawer title="Master Order Details Lookup" placement="right" styles={{ body: { width: 600 } }} onClose={() => setDrawerVisible(false)} open={drawerVisible} loading={loading} className="no-print">
                <Table dataSource={orders} rowKey="Invoice_No" size="small" pagination={{ pageSize: 6 }} columns={[
                    { title: 'Invoice No', dataIndex: 'Invoice_No', key: 'Invoice_No', render: id => <strong style={{ color: '#1890ff' }}>{id}</strong> },
                    { title: 'Customer', dataIndex: 'Customer_name', key: 'Customer_name' },
                    { title: 'Company / Brand', dataIndex: 'Company_Name', key: 'Company_Name' },
                    { title: 'State', dataIndex: 'State', key: 'State' },
                    { title: 'Items Count', dataIndex: 'Ordered_Products', key: 'count', render: arr => <span>{Array.isArray(arr) ? arr.length : 0} Varieties</span> },
                    { title: 'Action', key: 'pick', width: 90, render: (_, record) => <Button type="primary" size="small" onClick={() => selectOrderBundle(record)} style={{ borderRadius: 0 }}>Load Order</Button> }
                ]} />
            </Drawer>
        </Layout>
    );
}

export default InvoicePage;