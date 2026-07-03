import express from 'express';
import cors from 'cors';
import pool from './connection/db.js';
import fs from 'fs';  //Import native File System module
import path from 'path';  //Import path manager utilities

const app = express();

// 💡 Essential Middlewares — Must be loaded BEFORE defining any routes!
app.use(cors());
app.use(express.json());

console.log("🚀 Initializing Textiles ERP Master Backend System Router...");

// ==========================================
// 🔐 AUTHENTICATION ROUTE GATEWAY (DYNAMIC DATABASE CHECK)
// ==========================================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`🔑 Database login query triggered for user: "${username}"`);

    try {
        const [rows] = await pool.query(
            'SELECT * FROM sbk.user WHERE LOWER(username) = ?', 
            [String(username || '').toLowerCase()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Username configuration not found in the database.' 
            });
        }

        const userRecord = rows[0];

        if (String(userRecord.password) === String(password)) {
            return res.json({ 
                success: true, 
                message: `Welcome back to the portal, ${userRecord.username}!` 
            });
        } else {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid secure passkey credentials mismatch.' 
            });
        }
        
    } catch (error) {
        console.error("❌ Database Auth Error details:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 👕 UPDATED PRODUCTS PORTAL API ROUTE (table: product_details)
// ==========================================
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM product_details');
    // Map an empty string if Lungi_Name is missing/undefined from old rows
    const formatted = rows.map(r => ({ ...r, Lungi_Name: r.Lungi_Name || '' }));
    res.json({ success: true, data: formatted }); 
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🚀 PRODUCTS: INSERT ACTION (Includes Lungi_Name)
app.post('/api/products', async (req, res) => {
  const { Products, Lungi_Name, HSN_Code, QTY, Size, Rate, Discount, CGST, SGST } = req.body;
  try {
    const qtyNum = Number(QTY || 0);
    const rateNum = Number(Rate || 0);
    const discountNum = Number(Discount || 0); 
    const calculatedAmount = qtyNum * rateNum;
    const calculatedTaxableValue = Math.max(0, calculatedAmount - discountNum);

    const cgstRate = Number(CGST || 0);
    const sgstRate = Number(SGST || 0);
    const calculatedIGST = cgstRate + sgstRate; 
    
    // Check if table has Lungi_Name or insert safely
    try {
      await pool.query(
        'INSERT INTO product_details (Products, Lungi_Name, HSN_Code, QTY, Size, Rate, Amount, Discount, Taxable_Value, CGST, SGST, IGST) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [Products, Lungi_Name || '', HSN_Code, qtyNum, Size, rateNum, calculatedAmount, discountNum, calculatedTaxableValue, cgstRate, sgstRate, calculatedIGST]
      );
    } catch (sqlErr) {
      // Fallback if column is physically missing from DB layout
      await pool.query(
        'INSERT INTO product_details (Products, HSN_Code, QTY, Size, Rate, Amount, Discount, Taxable_Value, CGST, SGST, IGST) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [Products, HSN_Code, qtyNum, Size, rateNum, calculatedAmount, discountNum, calculatedTaxableValue, cgstRate, sgstRate, calculatedIGST]
      );
    }
    res.json({ success: true, message: 'Product saved cleanly!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================
// 🚀 FIXED: PRODUCT UPDATE ACTION (Checks both Products and Lungi_Name columns)
// ==========================================================================
app.put('/api/products/:id', async (req, res) => {
  const originalIdentifier = decodeURIComponent(req.params.id);
  const { Products, Lungi_Name, HSN_Code, QTY, Size, Rate, Amount, Discount, Taxable_Value, CGST, SGST, IGST } = req.body;
  
  try {
    // 🧠 Matches original target against either the Products column OR Lungi_Name column
    const queryStr = `
      UPDATE product_details 
      SET Products = ?, Lungi_Name = ?, HSN_Code = ?, QTY = ?, Size = ?, Rate = ?, Amount = ?, Discount = ?, Taxable_Value = ?, CGST = ?, SGST = ?, IGST = ? 
      WHERE Products = ? OR Lungi_Name = ?
    `;
    
    const [result] = await pool.query(queryStr, [
      Products, Lungi_Name || '', HSN_Code, Number(QTY || 0), Size, Number(Rate || 0), 
      Number(Amount || 0), Number(Discount || 0), Number(Taxable_Value || 0), 
      Number(CGST || 0), Number(SGST || 0), Number(IGST || 0), 
      originalIdentifier, originalIdentifier
    ]);

    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error("❌ MySQL Product Update Fault:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================
// 🚀 FIXED: PRODUCT DELETE ACTION (Checks both Products and Lungi_Name columns)
// ==========================================================================
app.delete('/api/products/:id', async (req, res) => {
  const targetIdentifier = decodeURIComponent(req.params.id);
  
  try {
    // 🧠 Deletes the item whether the name was stored under Products or Lungi_Name
    const [result] = await pool.query(
      'DELETE FROM product_details WHERE Products = ? OR Lungi_Name = ?', 
      [targetIdentifier, targetIdentifier]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "No matching product found." });
    }
    
    res.json({ success: true, message: 'Product profile successfully erased from catalog.' });
  } catch (err) {
    console.error("❌ MySQL Product Deletion Fault:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 👥 CUSTOMERS PORTAL API ROUTE ledgers (table: bill_to)
// ==========================================
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bill_to');
    res.json({ success: true, data: rows }); 
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🚀 CUSTOMERS: INSERT ACTION
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

// 🚀 CUSTOMERS: UPDATE EDIT ACTION (Targets exact primary 'id' column from bill_to table)
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

// 🚀 CUSTOMERS: DELETE ACTION (FIXED: Targets bill_to table using direct 'id')
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

// ==========================================
// 📈 GST DYNAMIC DATA LOOKUP ROUTES
// ==========================================
app.get('/api/gst-rates', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gst');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 📋 TRANSACTIONAL LEDGER ORDER MANIFEST ROUTES (table: order_details)
// ==========================================
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
        console.error("❌ Error on POST /api/orders:", err.message); // Will print the exact SQL error to terminal
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// 🚀 FIXED MANIFEST ENDPOINT: NOW TRANSMITS ORDER_STATUS CODES TO FRONTEND
// ==========================================================================
app.get('/api/orders-manifest', async (req, res) => {
    const query = `
        SELECT 
            Invoice_No, Customer_name, Company_Name, Address, State, State_Code, GSTIN_NO, Phone_no,
            Product_Name, HSN_Code, QTY, Size, Rate, Amount, Discount, Taxvalue, CGST_Rate, SGST_Rate, IGST_Rate,
            Order_Status -- 🚀 CRITICAL FIX: SELECT THE NEW COLUMN SPECIFICATION FROM DATABASE
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
                Order_Status: row.Order_Status //-- 🚀 CRITICAL FIX: PASS STATUS DOWN TO REACT ARRAY
            });
        });
        
        const finalResults = Object.values(manifestMap);
        res.json({ success: true, data: finalResults });
        
    } catch (err) {
        console.error("❌ Backend Mapping Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// 🚀 FIXED: PROCESS AND COMPLETE AN ENTIRE ORDER BY INVOICE NO
// ==========================================================================
app.put('/api/orders/complete/:invoiceNo', async (req, res) => {
    const invoiceNo = decodeURIComponent(req.params.invoiceNo);
    console.log(`📦 Shifting Order process to completed status for Invoice: "${invoiceNo}"`);

    try {
        // Update the status flag column inside your order_details table
        const updateQuery = "UPDATE order_details SET Order_Status = 'COMPLETED' WHERE Invoice_No = ?";
        const [result] = await pool.query(updateQuery, [invoiceNo]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No pending transaction rows found matching this invoice reference." 
            });
        }

        res.json({ success: true, message: 'Order status successfully flag-shifted to Completed archives!' });
    } catch (err) {
        console.error("❌ Order completion engine fault:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});
//delete
app.delete('/api/orders/:invoiceNo', async (req, res) => {
    const invoiceNo = decodeURIComponent(req.params.invoiceNo);
    try {
        await pool.query("DELETE FROM order_details WHERE Invoice_No = ?", [invoiceNo]);
        res.json({ success: true, message: 'Order bundle permanently removed from history!' });
    } catch (err) {
        console.error("❌ Order deletion failure:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// 🚀 FIXED: SAVE INVOICE DRAFT ENTRY MATRIX (Includes Lorry_Name Column Mapping)
// ==========================================================================
app.post('/api/invoices/save-draft', async (req, res) => {
    const { invoice_no, receiver_name, bale_no, lr_no, date, taxableSum, netTotal, lorry_name } = req.body;
    const company_name = req.body.company_name || req.body.Company_Name || '—';
    
    console.log(`💾 Persisting Invoice draft entry inside DB for Ref No: ${invoice_no}, Lorry: ${lorry_name}`);

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

        const updateOrderSql = "UPDATE order_details SET Order_Status = 'COMPLETED' WHERE Invoice_No = ?";
        await pool.query(updateOrderSql, [invoice_no]);

        res.json({ success: true, message: 'Invoice records synced successfully with transport logs!' });
    } catch (err) {
        console.error("❌ Save invoice draft execution failure:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// 🚀 2. FETCH ALL HISTORICAL INVOICES FOR THE REPORT PAGE
// ==========================================================================
app.get('/api/invoices-history', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM invoice_billing_ledger ORDER BY Invoice_Date DESC, id DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// 🗑️ DELETE AN INVOICE RECORD BY INVOICE NO
// ==========================================================================
app.delete('/api/invoices/:invoiceNo', async (req, res) => {
    const invoiceNo = decodeURIComponent(req.params.invoiceNo);
    try {
        const [result] = await pool.query("DELETE FROM invoice_billing_ledger WHERE Invoice_No = ?", [invoiceNo]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Invoice record not found." });
        }
        res.json({ success: true, message: "Invoice permanently removed from ledger archives." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Textiles Backend listening on http://localhost:${PORT}`));