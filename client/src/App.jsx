import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import LoginPage from "./Pages/LoginPage";
import DashboardPage from "./Pages/Dashboard"; // 💡 Matches your file name 'Dashboard.jsx'
import CustomersPage from "./Pages/CustomersPage";
import ProductPage from "./Pages/ProductPage";
import InvoicePage from "./Pages/InvoicePage";
import OrderPage from "./Pages/OrderPage";
import ReportPage from "./Pages/ReportPage"; 
function App() {
  return (
    <div className="app-container">
      <Routes>
        {/* Sends empty root pathways directly to the Login Panel */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<LoginPage />} />
        
        {/* Maps the redirect path to your actual component */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customers" element = {<CustomersPage/>} />
        <Route path="/products" element={<ProductPage/>} />
        <Route path="/invoices" element={<InvoicePage/>} />
        <Route path="/Invoice" element = {<InvoicePage/>}  />
        <Route path="/orders" element = {<OrderPage/>}  />
        <Route path="/reports" element = {<ReportPage/>}  />

        <Route path="/reports/invoices" element={<ReportPage />} />
        <Route path="/reports/orders" element={<ReportPage />} />
      </Routes>
    </div>
  );
}

export default App;