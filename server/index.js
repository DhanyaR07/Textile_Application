import express from 'express';
import cors from 'cors';
import pool from './connection/db.js';
import fs from 'fs';  // Import native File System module
import path from 'path';  // Import path manager utilities
import bcrypt from 'bcrypt'; // Added missing cryptographic module import!

const app = express();

// Essential Middlewares — Must be loaded BEFORE defining any routes!
app.use(cors());
app.use(express.json());

console.log("🚀 Initializing Textiles ERP Master Backend System Router...");

// ==========================================================================
// 🔐 SECURE ACCOUNT CREATION GATEWAY
// ==========================================================================
app.post('/api/register', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role || 'staff'; 
    
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

        return res.json({ success: true, message: 'Account successfully configured! Redirecting back to access portal...' });
    } catch (error) {
        console.error("❌ CRITICAL REGISTRATION DATABASE FAULT:", error.message);
        return res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
});

// ==========================================================================
// 🔐 AUTHENTICATION ROUTE GATEWAY
// ==========================================================================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`🔑 Database login query triggered for user: "${username}"`);

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
        console.error("❌ Database Auth Error details:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================================================
// 👕 UPDATED PRODUCTS PORTAL ROUTE (Remapped to properties: item, lable, size, type)
// ==========================================================================
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM product_details');
    res.json({ success: true, data: rows }); 
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🚀 PRODUCTS: INSERT ACTION
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

// 🚀 PRODUCTS: UPDATE EDIT ACTION
app.put('/api/products/:id', async (req, res) => {
  const originalItemName = decodeURIComponent(req.params.id);
  const { item, lable, HSN_Code, size, type } = req.body;
  
  try {
    const queryStr = 'UPDATE product_details SET item = ?, lable = ?, HSN_Code = ?, size = ?, type = ? WHERE item = ?';
    const [result] = await pool.query(queryStr, [item, lable, HSN_Code, size, type, originalItemName]);
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error("❌ MySQL Product Update Fault:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🚀 PRODUCTS: DELETE ACTION
app.delete('/api/products/:id', async (req, res) => {
  const targetItemName = decodeURIComponent(req.params.id);
  
  try {
    const [result] = await pool.query('DELETE FROM product_details WHERE item = ?', [targetItemName]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "No matching product found." });
    }
    res.json({ success: true, message: 'Product profile successfully erased from catalog.' });
  } catch (err) {
    console.error("❌ MySQL Product Deletion Fault:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================
// 👥 CUSTOMERS PORTAL API ROUTE ledgers (table: bill_to)
// ==========================================================================
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

// ==========================================================================
// 📈 GST DYNAMIC DATA LOOKUP ROUTES
// ==========================================================================
app.get('/api/gst-rates', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gst');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================
// 📋 TRANSACTIONAL LEDGER ORDER MANIFEST ROUTES (table: order_details)
// ==========================================================================
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
        console.error("❌ Error on POST /api/orders:", err.message); 
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
        console.error("❌ Backend Mapping Error:", err.message);
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

// ==========================================================================
// 🚀 FIXED: SAVE INVOICE DRAFT ENTRY MATRIX (UNIVERSAL SCHEMA SAFEGUARD)
// ==========================================================================
app.post('/api/invoices/save-draft', async (req, res) => {
    const { invoice_no, receiver_name, bale_no, lr_no, date, taxableSum, netTotal, lorry_name, through } = req.body;
    const company_name = req.body.company_name || req.body.Company_Name || '—';
    
    console.log(`💾 Persisting Invoice draft entry inside DB for Ref No: ${invoice_no}`);

    try {
        // Try executing using your master standard columns layout
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

        // Safely try updating the tracking manifests order state flag status
        try {
            await pool.query("UPDATE order_details SET Order_Status = 'COMPLETED' WHERE Invoice_No = ?", [invoice_no]);
        } catch (orderErr) {
            console.log("⚠️ Order table update status skipped:", orderErr.message);
        }

        return res.json({ success: true, message: 'Invoice records synced successfully!' });

    } catch (err) {
        console.error("❌ CRITICAL INVOICE SAVE FAULT. Attempting auto-fallback update...", err.message);
        
        try {
            // Fallback strategy: If your invoice table has lowercase column matching layouts from adjustments, try this:
            const fallbackSql = `
                INSERT INTO invoice_billing_ledger 
                (Invoice_No, Customer_Name, Net_Total, Invoice_Date) 
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE Customer_Name = ?, Net_Total = ?, Invoice_Date = ?
            `;
            await pool.query(fallbackSql, [
                invoice_no, receiver_name, Number(netTotal || 0), date,
                receiver_name, Number(netTotal || 0), date
            ]);
            
            return res.json({ success: true, message: 'Invoice records synced via structural fallback path!' });
        } catch (fallbackErr) {
            console.error("❌ Fallback query failed as well:", fallbackErr.message);
            return res.status(500).json({ 
                success: false, 
                error: "Database configuration layout mismatch", 
                details: err.message 
            });
        }
    }
});

app.get('/api/invoices-history', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM invoice_billing_ledger ORDER BY Invoice_Date DESC, id DESC');
        res.json({ success: true, data: rows });
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

const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Textiles Backend listening on http://localhost:${PORT}`));