import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../../context/Theme/useTheme";

const EmployeeAnalyticsWidget: FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [cookies] = useCookies();
  const theme = useTheme();

  useEffect(() => {
    axios
      .get(`http://localhost:5500/analytics/employees?period=${period}`, {
        headers: { Authorization: "barear " + cookies.auth.token },
      })
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error(err));
  }, [cookies.auth.token, period]);

  return (
    <div style={{ backgroundColor: theme.palette.secondary + "11", padding: "15px", borderRadius: "8px", marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Employee Performance (Leaderboard)</h3>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value as "daily"|"weekly"|"monthly")}
          style={{ padding: "5px", borderRadius: "4px" }}
        >
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
        </select>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px", fontSize: "12px" }}>
        <thead style={{ backgroundColor: theme.palette.secondary, color: "white" }}>
          <tr>
            <th style={{ padding: "8px", textAlign: "left" }}>Rank</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Cashier Name</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Transactions</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Total Revenue</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Avg Sale Value</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e: any, idx: number) => (
            <tr key={idx} style={{ borderBottom: "1px solid #ccc", backgroundColor: idx % 2 === 0 ? "transparent" : theme.palette.secondary + "11" }}>
              <td style={{ padding: "8px", fontWeight: "bold", color: idx === 0 ? "var(--color-warning)" : "inherit" }}>
                #{idx + 1}
              </td>
              <td style={{ padding: "8px" }}>{e._id || "Unknown"}</td>
              <td style={{ padding: "8px" }}>{e.transactions}</td>
              <td style={{ padding: "8px" }}>${e.totalRevenue.toFixed(2)}</td>
              <td style={{ padding: "8px" }}>${e.averageSale?.toFixed(2) || "0.00"}</td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr><td colSpan={5} style={{ padding: "15px", textAlign: "center" }}>No employee data for this period</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeAnalyticsWidget;
