import React, { FC, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";
import Button from "../../Components/Button";
import Input from "../../Components/Input";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ReportsPage: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const snackbar = useSnackbar();
  
  const isAdmin = cookies.auth?.admin;

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [productStats, setProductStats] = useState<any[]>([]);
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
      const response = await axios.get("/reports/chart", {
        headers: { Authorization: "barear " + cookies.auth?.token }
      });
      setChartData(response.data);

      const prodRes = await axios.get("/analytics/products", {
        headers: { Authorization: "barear " + cookies.auth?.token }
      });
      setProductStats(prodRes.data);
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
      const response = await axios.get(`/reports/sales/csv?start=${startDate}&end=${endDate}`, {
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
      const response = await axios.get(`/reports/inventory/csv`, {
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
      const response = await axios.get(`/reports/profit/csv?start=${startDate}&end=${endDate}`, {
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

  const handleDownloadVisualReport = async () => {
    const input = document.getElementById('visual-report-content');
    if (!input) return;
    setDownloadingPdf(true);
    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Calculate top margin to center if it's smaller than page height
      const margin = 10;
      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth - (margin*2), pdfHeight - (margin*2));
      pdf.save(`visual_report_${new Date().getTime()}.pdf`);
      snackbar.onResponse({ message: "Visual report downloaded successfully.", status: 200 });
    } catch (err) {
      console.error(err);
      snackbar.onResponse({ message: "Failed to generate visual report.", status: 500 });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div style={{ padding: "40px", color: theme.palette.textPrimary, backgroundColor: theme.palette.paper, minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "20px" }}>Business Reports Generator</h2>

      {/* Visual Report Section with ID for PDF rendering */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "20px" }}>
        <h3>Visual Analytics</h3>
        <Button variant="secondary" onClick={handleDownloadVisualReport} disabled={downloadingPdf || loadingCharts}>
          {downloadingPdf ? "Generating PDF..." : "Download Visual Report (PDF)"}
        </Button>
      </div>

      <div id="visual-report-content" style={{ 
        padding: "30px", 
        borderRadius: "8px", 
        backgroundColor: theme.palette.secondary + "11",
        border: `1px solid ${theme.palette.secondary}`,
        marginBottom: "40px",
        display: "flex",
        flexDirection: "column",
        gap: "40px"
      }}>
        <div>
          <h3 style={{ marginBottom: "20px" }}>Sales & Profit Trends (Last 7 Days)</h3>
          {loadingCharts ? (
            <p>Loading charts...</p>
          ) : chartData.length > 0 ? (
            <div style={{ height: "300px", width: "100%" }}>
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
                  <Area type="monotone" dataKey="revenue" stroke={theme.palette.primary} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (Ksh)" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" name="Profit (Ksh)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ marginTop: "20px", opacity: 0.7 }}>No sales data available for the last 7 days.</p>
          )}
        </div>

        <div>
          <h3 style={{ marginBottom: "20px" }}>Product Sales Distribution</h3>
          {loadingCharts ? (
            <p>Loading charts...</p>
          ) : productStats.length > 0 ? (
            <div style={{ height: "300px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="qtySold"
                    nameKey="_id"
                    label={({ name, percent }) => `${(name || "").substring(0, 10)} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {productStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: theme.palette.paper, borderColor: theme.palette.secondary, color: theme.palette.textPrimary }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ marginTop: "20px", opacity: 0.7 }}>No product data available.</p>
          )}
        </div>
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
