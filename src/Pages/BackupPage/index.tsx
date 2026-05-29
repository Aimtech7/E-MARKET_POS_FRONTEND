import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import Button from "../../Components/Button";
import style from "./style.module.css";

const BackupPage: FC = () => {
  const theme = useTheme();
  const [cookies] = useCookies();
  const snack = useSnackbar();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBackups = () => {
    axios.get("http://localhost:5500/backups", {
      headers: { Authorization: "barear " + cookies.auth.token }
    }).then(res => setBackups(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const triggerBackup = () => {
    setLoading(true);
    axios.post("http://localhost:5500/backups/trigger", {}, {
      headers: { Authorization: "barear " + cookies.auth.token }
    }).then(res => {
      snack.onResponse({ message: res.data.message, status: res.status });
      fetchBackups();
    }).catch(err => {
      snack.onResponse({ message: "Backup failed", status: 500 });
    }).finally(() => setLoading(false));
  };

  const triggerRestore = (filename: string) => {
    if (!window.confirm("Are you sure you want to restore this backup? This will overwrite current data!")) return;
    setLoading(true);
    axios.post("http://localhost:5500/backups/restore", { filename }, {
      headers: { Authorization: "barear " + cookies.auth.token }
    }).then(res => {
      snack.onResponse({ message: res.data.message, status: res.status });
    }).catch(err => {
      snack.onResponse({ message: "Restore failed", status: 500 });
    }).finally(() => setLoading(false));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={style.container} style={{ color: theme.palette.textPrimary, backgroundColor: theme.palette.paper }}>
      <div className={style.header}>
        <h2>Database Backup & Restore</h2>
        <Button onClick={triggerBackup} variant="success" disabled={loading}>
          {loading ? "Processing..." : "Create Backup Now"}
        </Button>
      </div>

      <div className={style.listContainer} style={{ border: `1px solid ${theme.palette.secondary}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: theme.palette.secondary, color: "white" }}>
            <tr>
              <th style={{ padding: "12px", textAlign: "left" }}>Date / Time</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Filename</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Size</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Triggered By</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((backup, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #ccc", backgroundColor: idx % 2 === 0 ? "transparent" : theme.palette.secondary + "11" }}>
                <td style={{ padding: "12px" }}>{new Date(backup.timestamp).toLocaleString()}</td>
                <td style={{ padding: "12px" }}>{backup.filename}</td>
                <td style={{ padding: "12px" }}>{formatSize(backup.size)}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{ color: backup.status === "Success" ? "green" : "red", fontWeight: "bold" }}>
                    {backup.status}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>{backup.triggeredBy}</td>
                <td style={{ padding: "12px" }}>
                  {backup.status === "Success" && (
                    <Button onClick={() => triggerRestore(backup.filename)} variant="error" disabled={loading}>
                      Restore
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {backups.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "20px", textAlign: "center" }}>No backups found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BackupPage;
