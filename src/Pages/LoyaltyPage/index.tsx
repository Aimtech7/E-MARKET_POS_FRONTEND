import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";

const LoyaltyPage: FC = () => {
  const theme = useTheme();
  const [cookies] = useCookies();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchLoyaltyStats();
  }, []);

  const fetchLoyaltyStats = () => {
    axios
      .get("http://localhost:5500/loyalty/dashboard", {
        headers: { Authorization: "Bearer " + cookies.auth.token },
      })
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  };

  return (
    <div style={{ padding: "20px", color: theme.palette.textPrimary, backgroundColor: theme.palette.paper, minHeight: "100vh" }}>
      <h2>Loyalty Program Dashboard</h2>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px", flexWrap: "wrap" }}>
        <div style={{ padding: "20px", borderRadius: "8px", backgroundColor: theme.palette.secondary + "22", border: "1px solid " + theme.palette.secondary, minWidth: "200px" }}>
          <h4 style={{ margin: "0 0 8px 0", opacity: 0.7 }}>Loyalty Revenue Generated</h4>
          <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: "bold" }}>${stats?.loyaltyRevenue?.toFixed(2) || "0.00"}</p>
        </div>
        <div style={{ padding: "20px", borderRadius: "8px", backgroundColor: theme.palette.secondary + "22", border: "1px solid " + theme.palette.secondary, minWidth: "200px" }}>
          <h4 style={{ margin: "0 0 8px 0", opacity: 0.7 }}>Outstanding Points</h4>
          <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: "bold" }}>{stats?.totalOutstandingPoints?.toString() || "0"}</p>
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <h3>Top Loyal Customers</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
          <thead style={{ backgroundColor: theme.palette.secondary }}>
            <tr>
              <th style={{ padding: "10px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Phone</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Tier</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Points</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {stats?.topCustomers?.map((c: any) => (
              <tr key={c._id} style={{ borderBottom: "1px solid " + theme.palette.secondary }}>
                <td style={{ padding: "10px" }}>{c.customerId?.name || "Unknown"}</td>
                <td style={{ padding: "10px" }}>{c.customerId?.phone || "N/A"}</td>
                <td style={{ padding: "10px", color: "var(--color-warning)", fontWeight: "bold" }}>{c.tier}</td>
                <td style={{ padding: "10px" }}>{c.points}</td>
                <td style={{ padding: "10px" }}>${c.totalSpent.toFixed(2)}</td>
              </tr>
            ))}
            {(!stats?.topCustomers || stats.topCustomers.length === 0) && (
              <tr><td colSpan={5} style={{ padding: "10px", textAlign: "center" }}>No loyalty accounts found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoyaltyPage;
