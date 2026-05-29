import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Form, Formik } from "formik";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import useTheme from "../../context/Theme/useTheme";
import { keys } from "../../context/Theme/Palettes";
import Select from "../../Components/Select";
import CartTable from "../../Components/CartTable";
import UserRow from "./UserRow";
import TextField from "../../Components/TextField";
import Button from "../../Components/Button";
import { userSchema } from "../../schema";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import style from "./style.module.css";

const Dashboard: FC = () => {
  const snack = useSnackbar();
  const theme = useTheme();
  const [cookies] = useCookies();
  const isAdmin = cookies.auth.admin;

  const [carts, setCarts] = useState<Cart[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Analytics State
  const [todayStats, setTodayStats] = useState<any>({ revenue: 0, orders: 0, averageSale: 0 });
  const [weekStats, setWeekStats] = useState<any>({ chartData: [], summary: { revenue: 0, orders: 0 } });
  const [monthStats, setMonthStats] = useState<any>({ chartData: [], summary: { revenue: 0, orders: 0 } });
  const [productStats, setProductStats] = useState<any[]>([]);
  const [stockStats, setStockStats] = useState<any>({ totalProducts: 0, lowStockCount: 0 });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [revenueView, setRevenueView] = useState<"week" | "month">("week");

  useEffect(() => {
    axios.defaults.headers.common.Authorization = "barear " + cookies.auth.token;

    // Fetch existing dashboard data
    axios.get("http://localhost:5500/cart/carts").then((res) => {
      let cartsList = res.data.map((c: any) => ({
        cartId: c._id,
        description: c.description,
        tax: c.tax,
        discount: c.discount,
        products: c.products.map((p: any) => ({ ...p, qty: p.qty })),
      }));
      setCarts(cartsList);
    });

    if (isAdmin) {
      axios.get("http://localhost:5500/user/users").then((res) => setUsers(res.data));
      axios.get("http://localhost:5500/audit").then((res) => setAuditLogs(res.data));

      // Fetch Analytics Data
      Promise.all([
        axios.get("http://localhost:5500/analytics/today"),
        axios.get("http://localhost:5500/analytics/week"),
        axios.get("http://localhost:5500/analytics/month"),
        axios.get("http://localhost:5500/analytics/products"),
        axios.get("http://localhost:5500/analytics/low-stock"),
      ]).then(([resToday, resWeek, resMonth, resProd, resStock]) => {
        setTodayStats(resToday.data);
        setWeekStats(resWeek.data);
        setMonthStats(resMonth.data);
        setProductStats(resProd.data);
        setStockStats(resStock.data);
      }).catch(err => {
        console.error("Error fetching analytics", err);
      });
    }
  }, [cookies.auth.token, isAdmin]);

  return (
    <div className={style.container} style={{ color: theme.palette.textPrimary, backgroundColor: theme.palette.paper }}>
      
      {/* 1. ANALYTICS SECTION (Admin Only) */}
      {isAdmin && (
        <div className={style.analyticsSection}>
          <h2 style={{ marginBottom: "20px" }}>Dashboard Overview</h2>
          
          {/* Summary Cards */}
          <div className={style.cardsGrid}>
            <div className={style.statCard} style={{ borderColor: theme.palette.secondary }}>
              <h3>Today's Sales</h3>
              <p className={style.statValue}>${todayStats.revenue.toFixed(2)}</p>
              <span className={style.statSub}>{todayStats.orders} Orders (Avg: ${todayStats.averageSale?.toFixed(2) || "0.00"})</span>
            </div>
            <div className={style.statCard} style={{ borderColor: theme.palette.secondary }}>
              <h3>Weekly Sales</h3>
              <p className={style.statValue}>${weekStats.summary.revenue.toFixed(2)}</p>
              <span className={style.statSub}>{weekStats.summary.orders} Orders</span>
            </div>
            <div className={style.statCard} style={{ borderColor: theme.palette.secondary }}>
              <h3>Monthly Sales</h3>
              <p className={style.statValue}>${monthStats.summary.revenue.toFixed(2)}</p>
              <span className={style.statSub}>{monthStats.summary.orders} Orders</span>
            </div>
            <div className={style.statCard} style={{ borderColor: theme.palette.secondary }}>
              <h3>Total Products</h3>
              <p className={style.statValue}>{stockStats.totalProducts}</p>
            </div>
            <div className={`${style.statCard} ${stockStats.lowStockCount > 0 ? style.dangerCard : ""}`} style={{ borderColor: theme.palette.secondary }}>
              <h3>Low Stock Items</h3>
              <p className={style.statValue}>{stockStats.lowStockCount}</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className={style.chartsGrid}>
            <div className={style.chartContainer} style={{ backgroundColor: theme.palette.secondary + "11" }}>
              <div className={style.chartHeader}>
                <h3>Revenue Trends</h3>
                <select 
                  value={revenueView} 
                  onChange={(e) => setRevenueView(e.target.value as "week"|"month")}
                  className={style.chartSelect}
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueView === "week" ? weekStats.chartData : monthStats.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <Line type="monotone" dataKey="revenue" stroke={theme.palette.primary} strokeWidth={3} />
                  <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={style.chartContainer} style={{ backgroundColor: theme.palette.secondary + "11" }}>
              <h3>Top Selling Products (Qty)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" tickFormatter={(tick) => tick.substring(0, 10)} />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="qtySold" fill={theme.palette.error} name="Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {isAdmin && <div className={style.divider} style={{ backgroundColor: theme.palette.secondary }} />}

      {/* 2. SETTINGS & SYSTEM CONFIGURATION */}
      <div className={style.mode}>
        <h3>System Theme</h3>
        <Select
          onChange={(value) => theme.changePalette(value.target.value as keys)}
          options={[
            { key: "dark", value: "dark" },
            { key: "primary", value: "white" },
            { key: "green", value: "green" },
            { key: "matrial", value: "matrial" },
          ]}
        />
      </div>

      <div className={style.divider} style={{ backgroundColor: theme.palette.secondary }} />

      {/* 3. CHECKED CARTS */}
      <div className={style.checkedCarts}>
        <h3>ACTIVE CHECKED CARTS</h3>
        <CartTable className={style.list} onChoose={() => {}} noButton carts={carts} />
      </div>

      <div className={style.divider} style={{ backgroundColor: theme.palette.secondary }} />

      {/* 4. USER MANAGEMENT (Admin Only) */}
      {isAdmin && (
        <div className={style.users}>
          <h3>SYSTEM USERS</h3>
          <div className={style.userList}>
            {users.map((u) => (
              <UserRow
                key={u.username}
                onClick={(e) => {
                  axios.delete("http://localhost:5500/user/delete/" + u.username).then((res) => {
                    snack.onResponse({ message: res.data.message, status: res.status });
                    setUsers(users.filter((user) => user.username !== u.username));
                  });
                }}
                isAdmin={u.admin}
                username={u.username}
              />
            ))}
          </div>
          <div className={style.userCreation}>
            <h4>CREATE NEW USER</h4>
            <Formik
              initialValues={{ username: "", password: "", isAdmin: false }}
              validationSchema={userSchema}
              onSubmit={(values, { resetForm }) => {
                axios.post("http://localhost:5500/user/create", {
                    username: values.username,
                    password: values.password,
                    admin: values.isAdmin,
                  }).then((res) => {
                    snack.onResponse({ message: res.data.username + " has been created", status: res.status });
                    setUsers((p) => [...p, res.data]);
                    resetForm();
                  }).catch(err => {
                    snack.onResponse({ message: err.response?.data?.message || "Error creating user", status: err.response?.status || 500 });
                  });
              }}
            >
              <Form className={style.form}>
                <p>UserName</p>
                <TextField placeholder="Enter Username" name="username" width="100%" />
                <p>Password</p>
                <TextField placeholder="Enter Password" name="password" type="password" width="100%" />
                <div className={style.row}>
                  <p>Admin?</p>
                  <TextField name="isAdmin" type="checkbox" width="4em" />
                </div>
                <div>
                  <Button type="submit" variant="error">Create User</Button>
                </div>
              </Form>
            </Formik>
          </div>
        </div>
      )}

      {isAdmin && <div className={style.divider} style={{ backgroundColor: theme.palette.secondary }} />}

      {/* 5. SYSTEM AUDIT LOGS (Admin Only) */}
      {isAdmin && (
        <div className={style.users}>
          <h3>SYSTEM AUDIT LOGS</h3>
          <div style={{ maxHeight: "400px", overflowY: "auto", border: `1px solid ${theme.palette.secondary}`, borderRadius: "4px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead style={{ backgroundColor: theme.palette.secondary, color: "white" }}>
                <tr>
                  <th style={{ padding: "8px", textAlign: "left" }}>Time</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>User</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Action</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #ccc", backgroundColor: idx % 2 === 0 ? "transparent" : theme.palette.secondary + "11" }}>
                    <td style={{ padding: "8px" }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ padding: "8px" }}>{log.username}</td>
                    <td style={{ padding: "8px" }}>{log.method} {log.url}</td>
                    <td style={{ padding: "8px" }}>{log.ip}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "15px", textAlign: "center" }}>No logs available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
