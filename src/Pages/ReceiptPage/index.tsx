import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";
import ReprintReceiptButton from "../../Components/ReprintReceiptButton";
import style from "./style.module.css";

const ReceiptPage: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const res = await axios.get("http://localhost:5500/receipt", {
          headers: { Authorization: "barear " + cookies.auth?.token },
        });
        setReceipts(res.data);
      } catch (err) {
        console.error("Failed to fetch receipts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, [cookies.auth?.token]);

  return (
    <div className={style.container} style={{ backgroundColor: theme.palette.paper, color: theme.palette.textPrimary }}>
      <div className={style.header}>
        <h1>Receipt History</h1>
        <p className={style.subInfo}>View and reprint past transaction receipts.</p>
      </div>

      <div className={style.tableWrapper}>
        {loading ? (
          <p className={style.loading}>Loading receipts...</p>
        ) : receipts.length === 0 ? (
          <p className={style.empty}>No receipts found.</p>
        ) : (
          <table className={style.table}>
            <thead>
              <tr style={{ color: theme.palette.textSecondary }}>
                <th>Date / Time</th>
                <th>Receipt #</th>
                <th>Customer</th>
                <th>Cashier</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r._id} style={{ borderBottom: `1px solid ${theme.palette.secondary}22` }}>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                  <td className={style.bold}>{r.receiptNumber}</td>
                  <td>{r.customer}</td>
                  <td>{r.cashier}</td>
                  <td className={style.bold}>${r.grandTotal?.toFixed(2)}</td>
                  <td>{r.paymentMethod}</td>
                  <td>
                    <ReprintReceiptButton receiptId={r._id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ReceiptPage;
