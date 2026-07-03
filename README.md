# Sri Banukrishna Textiles - Invoicing & Inventory Workspace

An enterprise-grade billing portal designed to manage purchased orders, 
generate spreadsheet-style commercial tax invoices, and track transport logistics.

# technologies, frameworks used here
Frontend: React, Vite, Ant Design, React Router DOM
Backend: Node.js, Express, MySQL

# Key Features

📦 Dynamic Portals: Real-time generation layout with separate historical invoice and order views.

🔍 Instant Filtering: Global search input bars located in headers to instantly filter entries.

🖨️ Print Automation: Custom CSS no-print classes that instantly hide sidebars and text boxes for standard invoice printing.

📁 Smart Backup: Auto-generates server-side backups grouped cleanly into calendar-year subfolders.

## 🗄️ Database Setup & Configurations

This application requires a MySQL database. Follow the steps below to initialize the structure:

### 1. Table Schema Structure
Create the database and execute the core table setups:

```sql
CREATE DATABASE textile_billing_db;
USE textile_billing_db;

-- Core Invoice Ledger Table
CREATE TABLE invoice_billing_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Invoice_No VARCHAR(50) UNIQUE NOT NULL,
    Customer_Name VARCHAR(255) NOT NULL,
    Company_Name VARCHAR(255),
    Invoice_Date DATE,
    Bale_No VARCHAR(50),
    LR_No VARCHAR(50),
    Lorry_Name VARCHAR(255) DEFAULT '—',
    Total_Taxable DECIMAL(10,2),
    Net_Total DECIMAL(10,2)
);

### 2. Environment Configuration

To connect the backend server to your database, create a .env file inside your /server

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=textile_billing_db
DB_PORT=3306

### 3. Installation & Execution Guide

### Server Execution
1. cd server
2. npm install
3. node index.js

### Client Execution
1. cd client
2. npm install
3. npm run dev
