import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";
import Button from "../../Components/Button";
import Input from "../../Components/Input";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import style from "./style.module.css";

const ClosurePage: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const snackbar = useSnackbar();

  const [data, setData] = useState<any>(null);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [actualCash, setActualCash] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [closures, setClosures] = useState<any[]>([]);

  const fetchClosureData = async () => {
    try {
      const res = await axios.get("http://localhost:5500/closures/data", {
        headers: { Authorization: "barear " + cookies.auth?.token },
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClosures = async () => {
    try {
      const res = await axios.get("http://localhost:5500/closures", {
        headers: { Authorization: "barear " + cookies.auth?.token },
      });
      setClosures(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClosureData();
    if (cookies.auth?.admin) {
      fetchClosures();
    }
  }, []);

  const handleSubmit = async () => {
    if (!data) return;
    try {
      await axios.post(
        "http://localhost:5500/closures/submit",
        {
          openingBalance,
          expectedCash: data.expectedCash + openingBalance,
          actualCash,
          totalSales: data.totalSales,
          totalRefunds: data.totalRefunds,
          notes,
        },
        { headers: { Authorization: "barear " + cookies.auth?.token } }
      );
      snackbar.onResponse({ message: "Closure submitted successfully!", status: 201 });
      if (cookies.auth?.admin) fetchClosures();
    } catch (err: any) {
      snackbar.onResponse({ message: err.response?.data?.message || "Error submitting closure", status: 500 });
    }
  };

  return (
    <div className={style.container} style={{ backgroundColor: theme.palette.paper, color: theme.palette.textPrimary }}>
      <h2>End of Day Closing</h2>
      {data && (
        <div className={style.closureCard} style={{ borderColor: theme.palette.secondary }}>
          <div className={style.statGrid}>
            <div className={style.statItem}>
              <span>Total Sales:</span>
              <strong>${data.totalSales.toFixed(2)}</strong>
            </div>
            <div className={style.statItem}>
              <span>Total Refunds:</span>
              <strong>${data.totalRefunds.toFixed(2)}</strong>
            </div>
            <div className={style.statItem}>
              <span>Expected Cash Sales:</span>
              <strong>${data.expectedCash.toFixed(2)}</strong>
            </div>
          </div>

          <div className={style.formGroup}>
            <label>Opening Balance ($)</label>
            <Input type="number" value={openingBalance} onChange={(e: any) => setOpeningBalance(parseFloat(e.target.value) || 0)} width="100%" />
          </div>

          <div className={style.formGroup}>
            <label>Expected Total in Drawer ($)</label>
            <Input type="number" value={(data.expectedCash + openingBalance).toFixed(2)} disabled width="100%" />
          </div>

          <div className={style.formGroup}>
            <label>Actual Cash Counted ($)</label>
            <Input type="number" value={actualCash} onChange={(e: any) => setActualCash(parseFloat(e.target.value) || 0)} width="100%" />
          </div>

          <div className={style.formGroup}>
            <label>Difference ($)</label>
            <strong style={{ color: (actualCash - (data.expectedCash + openingBalance)) < 0 ? 'red' : 'green' }}>
              {(actualCash - (data.expectedCash + openingBalance)).toFixed(2)}
            </strong>
          </div>

          <div className={style.formGroup}>
            <label>Notes (Optional)</label>
            <Input type="text" value={notes} onChange={(e: any) => setNotes(e.target.value)} width="100%" />
          </div>

          <Button variant="primary" onClick={handleSubmit} fullWidth>
            Submit Daily Closure
          </Button>
        </div>
      )}

      {cookies.auth?.admin && closures.length > 0 && (
        <div className={style.historySection}>
          <h3>Past Closures</h3>
          <table className={style.table}>
            <thead>
              <tr style={{ color: theme.palette.textSecondary }}>
                <th>Date</th>
                <th>Cashier</th>
                <th>Expected</th>
                <th>Actual</th>
                <th>Difference</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {closures.map(c => (
                <tr key={c._id}>
                  <td>{new Date(c.date).toLocaleDateString()}</td>
                  <td>{c.cashier}</td>
                  <td>${c.expectedCash?.toFixed(2)}</td>
                  <td>${c.actualCash?.toFixed(2)}</td>
                  <td style={{ color: c.difference < 0 ? 'red' : 'green' }}>${c.difference?.toFixed(2)}</td>
                  <td>{c.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClosurePage;
