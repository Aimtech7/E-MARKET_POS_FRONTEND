import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";

const ExpiryAlertsWidget: FC = () => {
  const [alerts, setAlerts] = useState<any>({ expiringIn30Days: [], alreadyExpired: [] });
  const [cookies] = useCookies();
  const theme = useTheme();

  useEffect(() => {
    axios
      .get("/analytics/expiry", {
        headers: { Authorization: "barear " + cookies.auth.token },
      })
      .then((res) => setAlerts(res.data))
      .catch((err) => console.error(err));
  }, [cookies.auth.token]);

  return (
    <div style={{ backgroundColor: theme.palette.secondary + "11", padding: "15px", borderRadius: "8px", marginTop: "20px" }}>
      <h3 style={{ color: "var(--color-danger)" }}>Expiry Alerts</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px", fontSize: "12px" }}>
        <thead style={{ backgroundColor: theme.palette.secondary, color: "white" }}>
          <tr>
            <th style={{ padding: "8px", textAlign: "left" }}>Product</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Stock Qty</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Expiry Date</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {alerts.alreadyExpired.map((p: any, idx: number) => (
            <tr key={`expired-${idx}`} style={{ backgroundColor: "rgba(255, 0, 0, 0.1)", borderBottom: "1px solid #ccc" }}>
              <td style={{ padding: "8px" }}>{p.productName}</td>
              <td style={{ padding: "8px" }}>{p.stockQuantity}</td>
              <td style={{ padding: "8px" }}>{new Date(p.expiryDate).toLocaleDateString()}</td>
              <td style={{ padding: "8px", fontWeight: "bold", color: "red" }}>EXPIRED</td>
            </tr>
          ))}
          {alerts.expiringIn30Days.map((p: any, idx: number) => (
            <tr key={`expiring-${idx}`} style={{ backgroundColor: "rgba(255, 165, 0, 0.1)", borderBottom: "1px solid #ccc" }}>
              <td style={{ padding: "8px" }}>{p.productName}</td>
              <td style={{ padding: "8px" }}>{p.stockQuantity}</td>
              <td style={{ padding: "8px" }}>{new Date(p.expiryDate).toLocaleDateString()}</td>
              <td style={{ padding: "8px", fontWeight: "bold", color: "orange" }}>EXPIRING SOON</td>
            </tr>
          ))}
          {alerts.alreadyExpired.length === 0 && alerts.expiringIn30Days.length === 0 && (
            <tr><td colSpan={4} style={{ padding: "15px", textAlign: "center" }}>No expiry alerts</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExpiryAlertsWidget;
