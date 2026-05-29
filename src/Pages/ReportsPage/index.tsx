import React, { FC, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";
import Button from "../../Components/Button";
import Input from "../../Components/Input";
import useSnackbar from "../../context/Snackbar/useSnackbar";

const ReportsPage: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const snackbar = useSnackbar();
  
  const isAdmin = cookies.auth?.admin;

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [downloading, setDownloading] = useState<boolean>(false);

  if (!isAdmin) {
    return (
      <div style={{ padding: "40px", color: theme.palette.textPrimary, textAlign: "center" }}>
        <h2>Unauthorized Access</h2>
        <p>You do not have permission to view reports.</p>
      </div>
    );
  }

  const handleDownloadSales = async () => {
    if (!startDate || !endDate) {
      snackbar.onResponse({ message: "Please select start and end dates.", status: 400 });
      return;
    }
    
    setDownloading(true);
    try {
      const token = cookies.auth?.token;
      const response = await axios.get(`http://localhost:5500/reports/sales/csv?start=${startDate}&end=${endDate}`, {
        headers: { Authorization: `barear ${token}` },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      snackbar.onResponse({ message: "Sales report downloaded successfully.", status: 200 });
    } catch (err) {
      console.error(err);
      snackbar.onResponse({ message: "Failed to download sales report.", status: 500 });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadInventory = async () => {
    setDownloading(true);
    try {
      const token = cookies.auth?.token;
      const response = await axios.get(`http://localhost:5500/reports/inventory/csv`, {
        headers: { Authorization: `barear ${token}` },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      snackbar.onResponse({ message: "Inventory report downloaded successfully.", status: 200 });
    } catch (err) {
      console.error(err);
      snackbar.onResponse({ message: "Failed to download inventory report.", status: 500 });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ padding: "40px", color: theme.palette.textPrimary, backgroundColor: theme.palette.paper, height: "100vh" }}>
      <h2 style={{ marginBottom: "20px" }}>Business Reports Generator</h2>

      <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
        {/* Sales Report Card */}
        <div style={{ 
          padding: "30px", 
          borderRadius: "8px", 
          backgroundColor: theme.palette.secondary + "11",
          border: `1px solid ${theme.palette.secondary}`,
          flex: 1, minWidth: "300px" 
        }}>
          <h3>Sales Report (CSV)</h3>
          <p style={{ opacity: 0.8, fontSize: "14px", marginBottom: "20px" }}>
            Export detailed sales history, including cashier names, items count, and total revenue for a specific period.
          </p>
          
          <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}>Start Date</label>
              <Input type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} width="100%" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}>End Date</label>
              <Input type="date" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} width="100%" />
            </div>
          </div>
          
          <Button variant="primary" onClick={handleDownloadSales} disabled={downloading} fullWidth>
            Download Sales Report
          </Button>
        </div>

        {/* Inventory Report Card */}
        <div style={{ 
          padding: "30px", 
          borderRadius: "8px", 
          backgroundColor: theme.palette.secondary + "11",
          border: `1px solid ${theme.palette.secondary}`,
          flex: 1, minWidth: "300px" 
        }}>
          <h3>Inventory Status Report (CSV)</h3>
          <p style={{ opacity: 0.8, fontSize: "14px", marginBottom: "20px" }}>
            Export a full snapshot of current stock levels, pricing, category mappings, and reorder alerts.
          </p>
          
          <div style={{ marginBottom: "20px", height: "57px" }}>
            {/* Spacer to align with the date inputs of the sales card */}
          </div>
          
          <Button variant="primary" onClick={handleDownloadInventory} disabled={downloading} fullWidth>
            Download Inventory Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
