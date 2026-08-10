import express from 'express';
import cors from 'cors';
import pool from './connection/db.js';
import bcrypt from 'bcrypt';

const app = express();

app.use(cors());
app.use(express.json());

console.log("🚀 Initializing Textiles ERP Master Backend System Router...");

// 🔐 REGISTER ROUTE
app.post('/api/register', async (req, res) => {
    const { username, password, role = 'staff' } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password configurations are mandatory.' });
    }

    try {
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE LOWER(username) = ?',
            [String(username).toLowerCase()]
        );

        if (existingUsers.length > 0) { 
            return res.status(400).json({ success: false, message: 'This identification username has already been registered.' });
        }

        const saltRounds = 10;
        const encryptedHash = await bcrypt.hash(String(password), saltRounds);

        const sqlInsert = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        await pool.query(sqlInsert, [String(username), encryptedHash, String(role)]);

        return res.json({ success: true, message: 'Account successfully configured!' });
    } catch (error) {
        console.error("❌ REGISTRATION FAULT:", error.message);
        return res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
});

// 🔐 LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE LOWER(username) = ?',
            [String(username || '').toLowerCase()]
        );
       
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Username configuration not found in the database.' });
        }

        const userRecord = rows[0];
        const isMatch = await bcrypt.compare(String(password), userRecord.password);

        if (isMatch) {
            return res.json({ 
                success: true, 
                message: `Welcome back to the portal, ${userRecord.username}!`,
                user: { username: userRecord.username, role: userRecord.role }
            });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid secure passkey credentials mismatch.' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// 👕 PRODUCTS ROUTES
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM product_details');
    res.json({ success: true, data: rows }); 
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const { item, lable, HSN_Code, size, type } = req.body;
  try {
    const insertSql = 'INSERT INTO product_details (item, lable, HSN_Code, size, type) VALUES (?, ?, ?, ?, ?)';
    await pool.query(insertSql, [item, lable, HSN_Code, size, type]);
    res.json({ success: true, message: 'Product configuration saved cleanly!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const originalItemName = decodeURIComponent(req.params.id);
  const { item, lable, HSN_Code, size, type } = req.body;
  
  try {
    const queryStr = 'UPDATE product_details SET item = ?, lable = ?, HSN_Code = ?, size = ?, type = ? WHERE item = ?';
    const [result] = await pool.query(queryStr, [item, lable, HSN_Code, size, type, originalItemName]);
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const targetItemName = decodeURIComponent(req.params.id);
  try {
    const [result] = await pool.query('DELETE FROM product_details WHERE item = ?', [targetItemName]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "No matching product found." });
    }
    res.json({ success: true, message: 'Product profile successfully erased from catalog.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 👥 CUSTOMERS ROUTES
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bill_to');
    res.json({ success: true, data: rows }); 
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { Name, Company_Name, Address, State, StateCode, GSTIN_NO, phone_no } = req.body;
  try {
    await pool.query(
      'INSERT INTO bill_to (Name, Company_Name, Address, State, StateCode, GSTIN_NO, phone_no) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [Name, Company_Name, Address, State, StateCode, GSTIN_NO, phone_no]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const customerId = req.params.id;
  const { Name, Company_Name, Address, State, StateCode, GSTIN_NO, phone_no } = req.body;
  try {
    await pool.query(
      'UPDATE bill_to SET Name = ?, Company_Name = ?, Address = ?, State = ?, StateCode = ?, GSTIN_NO = ?, phone_no = ? WHERE id = ?',
      [Name, Company_Name, Address, State, StateCode, GSTIN_NO, phone_no, customerId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  const customerId = req.params.id;
  try {
    const [result] = await pool.query('DELETE FROM bill_to WHERE id = ?', [customerId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "No customer account profile matched." });
    }
    res.json({ success: true, message: 'Customer cleared successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📈 GST RATES
app.get('/api/gst-rates', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gst');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📋 ORDERS MANIFEST ROUTES
app.post('/api/orders', async (req, res) => {
    const orderData = req.body;
    const stateCheck = String(orderData.State || '').trim().toUpperCase();
    
    try {
        const [gstRows] = await pool.query('SELECT * FROM gst WHERE UPPER(State) = ?', [stateCheck]);
        let cgstRate = 0.00, sgstRate = 0.00, igstRate = 0.00;
        
        if (gstRows.length > 0) {
            cgstRate = Number(gstRows[0].CGST || 0);
            sgstRate = Number(gstRows[0].SGST || 0);
            igstRate = Number(gstRows[0].IGST || 0);
        } else {
            if (stateCheck === 'TAMIL NADU') {
                cgstRate = 2.50; sgstRate = 2.50; igstRate = 0.00;
            } else {
                cgstRate = 0.00; sgstRate = 0.00; igstRate = 5.00;
            }
        }
        
        const amt = Number(orderData.QTY || 1) * Number(orderData.Rate || 0);
        const disc = Number(orderData.Discount || 0);
        const taxableVal = Math.max(0, amt - disc);
        
        const calculatedTax = stateCheck === 'TAMIL NADU' 
            ? (taxableVal * ((cgstRate + sgstRate) / 100)) 
            : (taxableVal * (igstRate / 100));

        const insertQuery = `
            INSERT INTO order_details (
                Invoice_No, Customer_name, Company_Name, Address, State, State_Code, 
                GSTIN_NO, Phone_no, Product_Name, HSN_Code, QTY, Size, Rate, 
                Amount, Discount, Taxvalue, CGST_Rate, SGST_Rate, IGST_Rate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            orderData.Invoice_No, orderData.Customer_name, orderData.Company_Name, orderData.Address,
            orderData.State, orderData.State_Code, orderData.GSTIN_NO, orderData.Phone_no,
            orderData.Product_Name, orderData.HSN_Code, orderData.QTY, orderData.Size, orderData.Rate,
            amt, disc, calculatedTax, cgstRate, sgstRate, igstRate
        ];

        const [result] = await pool.query(insertQuery, values);
        res.json({ success: true, message: 'Order item recorded!', id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/orders-manifest', async (req, res) => {
    const query = `
        SELECT 
            Invoice_No, Customer_name, Company_Name, Address, State, State_Code, GSTIN_NO, Phone_no,
            Product_Name, HSN_Code, QTY, Size, Rate, Amount, Discount, Taxvalue, CGST_Rate, SGST_Rate, IGST_Rate,
            Order_Status 
        FROM order_details
        ORDER BY Invoice_No DESC
    `;
    
    try {
        const [rawRows] = await pool.query(query);
        const manifestMap = {};
        
        rawRows.forEach(row => {
            const key = row.Invoice_No;
            
            if (!manifestMap[key]) {
                manifestMap[key] = {
                    Invoice_No: row.Invoice_No,
                    Customer_name: row.Customer_name,
                    Company_Name: row.Company_Name,
                    Address: row.Address,
                    State: row.State,
                    State_Code: row.State_Code,
                    GSTIN_NO: row.GSTIN_NO,
                    Phone_no: row.Phone_no,
                    Ordered_Products: []
                };
            }
            
            manifestMap[key].Ordered_Products.push({
                Product_Name: row.Product_Name,
                HSN_Code: row.HSN_Code,
                QTY: row.QTY,
                Size: row.Size,
                Rate: row.Rate,
                Amount: row.Amount,
                Discount: row.Discount,
                Taxvalue: row.Taxvalue,
                CGST_Rate: row.CGST_Rate,
                SGST_Rate: row.SGST_Rate,
                IGST_Rate: row.IGST_Rate,
                Order_Status: row.Order_Status 
            });
        });
        
        const finalResults = Object.values(manifestMap);
        res.json({ success: true, data: finalResults });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/orders/complete/:invoiceNo', async (req, res) => {
    const invoiceNo = decodeURIComponent(req.params.invoiceNo);
    try {
        const updateQuery = "UPDATE order_details SET Order_Status = 'COMPLETED' WHERE Invoice_No = ?";
        const [result] = await pool.query(updateQuery, [invoiceNo]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "No pending transaction rows found." });
        }
        res.json({ success: true, message: 'Order status successfully shifted to Completed!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/orders/:invoiceNo', async (req, res) => {
    const invoiceNo = decodeURIComponent(req.params.invoiceNo);
    try {
        await pool.query("DELETE FROM order_details WHERE Invoice_No = ?", [invoiceNo]);
        res.json({ success: true, message: 'Order bundle permanently removed.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 🚀 INVOICES SAVE DRAFT ROUTE
app.post('/api/invoices/save-draft', async (req, res) => {
    const { invoice_no, receiver_name, bale_no, lr_no, date, taxableSum, netTotal, lorry_name } = req.body;
    const company_name = req.body.company_name || req.body.Company_Name || '—';
    
    try {
        const invoiceSql = `
            INSERT INTO invoice_billing_ledger 
            (Invoice_No, Customer_Name, Company_Name, Total_Taxable, Net_Total, Bale_No, LR_No, Invoice_Date, Lorry_Name) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            Customer_Name = ?, Company_Name = ?, Total_Taxable = ?, Net_Total = ?, Bale_No = ?, LR_No = ?, Invoice_Date = ?, Lorry_Name = ?
        `;
        
        await pool.query(invoiceSql, [
            invoice_no, receiver_name, company_name, Number(taxableSum || 0), Number(netTotal || 0), bale_no, lr_no, date, lorry_name,
            receiver_name, company_name, Number(taxableSum || 0), Number(netTotal || 0), bale_no, lr_no, date, lorry_name
        ]);

        try {
            await pool.query("UPDATE order_details SET Order_Status = 'COMPLETED' WHERE Invoice_No = ?", [invoice_no]);
        } catch (orderErr) {
            console.log("⚠️ Order status skip:", orderErr.message);
        }

        return res.json({ success: true, message: 'Invoice records synced successfully!' });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 📑 SAVED INVOICES HISTORY ROUTE
app.get('/api/invoices-history', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM invoice_billing_ledger ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 🔍 FETCH SINGLE INVOICE DETAILS FOR PRINT PREVIEW
app.get('/api/invoices/details/:invoiceNo', async (req, res) => {
    const invoiceNo = decodeURIComponent(req.params.invoiceNo);
    try {
        const [invRows] = await pool.query('SELECT * FROM invoice_billing_ledger WHERE Invoice_No = ?', [invoiceNo]);
        const [orderRows] = await pool.query('SELECT * FROM order_details WHERE Invoice_No = ?', [invoiceNo]);

        const invoice = invRows[0] || {};
        
        res.json({
            success: true,
            data: {
                ...invoice,
                Company_Name: invoice.Company_Name || invoice.company_name || orderRows[0]?.Company_Name || '—',
                Customer_Name: invoice.Customer_Name || invoice.customer_name || orderRows[0]?.Customer_name || '—',
                Address: orderRows[0]?.Address || invoice.Address || '—',
                Bale_No: invoice.Bale_No || invoice.bale_no || orderRows[0]?.Bale_No || '—',
                LR_No: invoice.LR_No || invoice.lr_no || orderRows[0]?.LR_No || '—',
                Lorry_Name: invoice.Lorry_Name || invoice.lorry_name || orderRows[0]?.Lorry_Name || '—',
                items: orderRows
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/invoices/:invoiceNo', async (req, res) => {
    const invoiceNo = decodeURIComponent(req.params.invoiceNo);
    try {
        const [result] = await pool.query("DELETE FROM invoice_billing_ledger WHERE Invoice_No = ?", [invoiceNo]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Invoice not found." });
        res.json({ success: true, message: "Invoice permanently removed." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Textiles Backend listening on port ${PORT}`));