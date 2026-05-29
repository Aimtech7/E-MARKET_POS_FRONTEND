import React, { FC, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";
import Button from "../../Components/Button";
import Input from "../../Components/Input";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const ReportsPage: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const snackbar = useSnackbar();
  
  const isAdmin = cookies.auth?.admin;

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [downloading, setDownloading] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingCharts, setLoadingCharts] = useState<boolean>(false);

  React.useEffect(() => {
    if (isAdmin) {
      fetchChartData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchChartData = async () => {
    setLoadingCharts(true);
    try {
      const response = await axios.get("http://localhost:5500/reports/chart", {
        headers: { Authorization: "barear " + cookies.auth?.token }
      });
      setChartData(response.data);
    } catch (err) {
      console.error(err);
      snackbar.onResponse({ message: "Failed to fetch chart data.", status: 500 });
    } finally {
      setLoadingCharts(false);
    }
  };

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

  const handleDownloadProfit = async () => {
    if (!startDate || !endDate) {
      snackbar.onResponse({ message: "Please select start and end dates.", status: 400 });
      return;
    }
    
    setDownloading(true);
    try {
      const token = cookies.auth?.token;
      const response = await axios.get(`http://localhost:5500/reports/profit/csv?start=${startDate}&end=${endDate}`, {
        headers: { Authorization: `barear ${token}` },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `profit_report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      snackbar.onResponse({ message: "Profit report downloaded successfully.", status: 200 });
    } catch (err) {
      console.error(err);
      snackbar.onResponse({ message: "Failed to download profit report.", status: 500 });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ padding: "40px", color: theme.palette.textPrimary, backgroundColor: theme.palette.paper, minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "20px" }}>Business Reports Generator</h2>

      {/* Chart Section */}
      <div style={{ 
        padding: "30px", 
        borderRadius: "8px", 
        backgroundColor: theme.palette.secondary + "11",
        border: `1px solid ${theme.palette.secondary}`,
        marginBottom: "40px",
      }}>
        <h3>Sales & Profit Trends (Last 7 Days)</h3>
        {loadingCharts ? (
          <p>Loading charts...</p>
        ) : chartData.length > 0 ? (
          <div style={{ height: "300px", width: "100%", marginTop: "20px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke={theme.palette.textSecondary} />
                <YAxis stroke={theme.palette.textSecondary} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <Tooltip contentStyle={{ backgroundColor: theme.palette.paper, borderColor: theme.palette.secondary, color: theme.palette.textPrimary }} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke={theme.palette.primary} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" name="Profit ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ marginTop: "20px", opacity: 0.7 }}>No sales data available for the last 7 days.</p>
        )}
      </div>

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

        {/* Profit Report Card */}
        <div style={{ 
          padding: "30px", 
          borderRadius: "8px", 
          backgroundColor: theme.palette.secondary + "11",
          border: `1px solid ${theme.palette.secondary}`,
          flex: 1, minWidth: "300px" 
        }}>
          <h3>Profit Report (CSV)</h3>
          <p style={{ opacity: 0.8, fontSize: "14px", marginBottom: "20px" }}>
            Export revenue, costs, and profit margin analysis for a specific period.
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
          
          <Button variant="success" onClick={handleDownloadProfit} disabled={downloading} fullWidth>
            Download Profit Report
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
