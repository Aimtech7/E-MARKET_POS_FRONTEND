import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";

const InventoryForecastWidget: FC = () => {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [cookies] = useCookies();
  const theme = useTheme();

  useEffect(() => {
    axios
      .get("/analytics/forecast", {
        headers: { Authorization: "barear " + cookies.auth.token },
      })
      .then((res) => setForecasts(res.data.slice(0, 10))) // Top 10 items
      .catch((err) => console.error(err));
  }, [cookies.auth.token]);

  return (
    <div style={{ backgroundColor: theme.palette.secondary + "11", padding: "15px", borderRadius: "8px", marginTop: "20px" }}>
      <h3>Inventory Forecast & Smart Restock</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px", fontSize: "12px" }}>
        <thead style={{ backgroundColor: theme.palette.secondary, color: "white" }}>
          <tr>
            <th style={{ padding: "8px", textAlign: "left" }}>Product</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Current Stock</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Avg Weekly Sales</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Est. Stock Out</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Recommended Order</th>
          </tr>
        </thead>
        <tbody>
          {forecasts.map((f: any, idx: number) => (
            <tr key={idx} style={{ borderBottom: "1px solid #ccc", backgroundColor: idx % 2 === 0 ? "transparent" : theme.palette.secondary + "11" }}>
              <td style={{ padding: "8px" }}>{f.productName}</td>
              <td style={{ padding: "8px" }}>{f.currentStock}</td>
              <td style={{ padding: "8px" }}>{f.avgWeeklySales}</td>
              <td style={{ padding: "8px", color: f.daysUntilStockOut <= 7 ? "var(--color-danger)" : "inherit" }}>
                {f.daysUntilStockOut === -1 ? "N/A" : `${f.daysUntilStockOut} days`}
              </td>
              <td style={{ padding: "8px", fontWeight: "bold", color: f.suggestedOrderQty > 0 ? "var(--color-warning)" : "inherit" }}>
                {f.suggestedOrderQty} units
              </td>
            </tr>
          ))}
          {forecasts.length === 0 && (
            <tr><td colSpan={5} style={{ padding: "15px", textAlign: "center" }}>No forecast data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryForecastWidget;
