import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import style from "./style.module.css";
import Table from "../../Components/Table";
import Badge from "../../Components/Badge";
import Input from "../../Components/Input";

const AuditLogsPage: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const snackbar = useSnackbar();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/audit", {
        headers: { Authorization: "barear " + cookies.auth?.token }
      });
      setLogs(response.data);
    } catch (err) {
      console.error(err);
      snackbar.onResponse({ message: "Failed to fetch audit logs.", status: 500 });
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch(method) {
      case "GET": return "info";
      case "POST": return "success";
      case "PUT": return "warning";
      case "DELETE": return "danger";
      case "PATCH": return "primary";
      default: return "secondary";
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      (log.username && log.username.toLowerCase().includes(term)) ||
      (log.url && log.url.toLowerCase().includes(term)) ||
      (log.method && log.method.toLowerCase().includes(term))
    );
  });

  return (
    <div className={style.container} style={{ backgroundColor: theme.palette.paper, color: theme.palette.textPrimary, minHeight: "100vh", padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>System Audit Logs</h2>
      </div>
      
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <Input 
          placeholder="Search by user, method, or URL..." 
          value={searchTerm} 
          onChange={(e: any) => setSearchTerm(e.target.value)} 
          width="300px" 
        />
      </div>

      <Table
        headers={["Timestamp", "User", "Method", "URL", "IP Address", "Payload"]}
        data={filteredLogs.map(log => [
          new Date(log.timestamp).toLocaleString(),
          log.username || "Anonymous",
          <Badge type={getMethodColor(log.method)} title={log.method} />,
          <span style={{ fontFamily: "monospace", fontSize: "13px" }}>{log.url}</span>,
          log.ip,
          <div style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px", opacity: 0.8 }}>
            {JSON.stringify(log.payload)}
          </div>
        ])}
        loading={loading}
      />
    </div>
  );
};

export default AuditLogsPage;
