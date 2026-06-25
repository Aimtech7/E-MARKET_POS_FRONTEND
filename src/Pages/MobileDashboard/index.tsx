import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";
import style from "./style.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine, faBoxOpen, faRobot } from "@fortawesome/free-solid-svg-icons";

const MobileDashboard: FC = () => {
  const theme = useTheme();
  const [cookies] = useCookies();
  const [activeTab, setActiveTab] = useState<"sales" | "inventory" | "ai">("sales");

  const [todayStats, setTodayStats] = useState<any>({ revenue: 0, orders: 0, profit: 0 });
  const [stockStats, setStockStats] = useState<any>({ totalProducts: 0, lowStockCount: 0 });
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  useEffect(() => {
    if (cookies.auth?.token) {
      axios.defaults.headers.common.Authorization = "barear " + cookies.auth.token;

      Promise.all([
        axios.get("/analytics/today"),
        axios.get("/analytics/low-stock"),
        axios.get("/analytics/ai/insights")
      ]).then(([resToday, resStock, resAi]) => {
        setTodayStats(resToday.data);
        setStockStats(resStock.data);
        setAiInsights(resAi.data.insights || []);
      }).catch(err => console.error("Mobile Dashboard fetch error:", err));
    }
  }, [cookies.auth?.token]);

  return (
    <div className={style.mobileContainer} style={{ backgroundColor: theme.palette.paper, color: theme.palette.textPrimary }}>
      <header className={style.header} style={{ backgroundColor: theme.palette.primary, color: "white" }}>
        <h2>AIM Mobile POS</h2>
      </header>

      <main className={style.content}>
        {activeTab === "sales" && (
          <div className={style.tabContent}>
            <h3>Today's Performance</h3>
            <div className={style.card} style={{ borderColor: theme.palette.secondary }}>
              <h4>Revenue</h4>
              <p className={style.value}>${todayStats.revenue.toFixed(2)}</p>
              <p className={style.subValue}>{todayStats.orders} Orders</p>
            </div>
            <div className={style.card} style={{ borderColor: theme.palette.secondary }}>
              <h4>Profit</h4>
              <p className={style.value} style={{ color: "var(--color-success)" }}>${(todayStats.profit || 0).toFixed(2)}</p>
            </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className={style.tabContent}>
            <h3>Inventory Overview</h3>
            <div className={style.card} style={{ borderColor: theme.palette.secondary }}>
              <h4>Total Products</h4>
              <p className={style.value}>{stockStats.totalProducts}</p>
            </div>
            <div className={`${style.card} ${stockStats.lowStockCount > 0 ? style.dangerCard : ""}`} style={{ borderColor: theme.palette.secondary }}>
              <h4>Low Stock Alerts</h4>
              <p className={style.value}>{stockStats.lowStockCount}</p>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className={style.tabContent}>
            <h3>AIM Business Assistant</h3>
            
            {aiInsights.length === 0 ? (
              <p style={{ textAlign: "center", marginTop: "20px" }}>Loading insights...</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {aiInsights.map((insight: any, idx: number) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: "flex", 
                      alignItems: "flex-start", 
                      gap: "12px", 
                      padding: "12px", 
                      backgroundColor: theme.palette.secondary + "11",
                      borderRadius: "6px",
                      borderLeft: `4px solid ${insight.type === 'danger' ? 'red' : insight.type === 'warning' ? 'orange' : insight.type === 'success' ? 'var(--color-success)' : 'var(--color-primary)'}`
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.4" }}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <nav className={style.bottomNav} style={{ backgroundColor: theme.palette.paper, borderTop: `1px solid ${theme.palette.secondary}` }}>
        <button 
          className={`${style.navBtn} ${activeTab === "sales" ? style.activeNav : ""}`} 
          onClick={() => setActiveTab("sales")}
          style={{ color: activeTab === "sales" ? theme.palette.primary : theme.palette.textSecondary }}
        >
          <FontAwesomeIcon icon={faChartLine} size="lg" />
          <span>Sales</span>
        </button>
        <button 
          className={`${style.navBtn} ${activeTab === "inventory" ? style.activeNav : ""}`} 
          onClick={() => setActiveTab("inventory")}
          style={{ color: activeTab === "inventory" ? theme.palette.primary : theme.palette.textSecondary }}
        >
          <FontAwesomeIcon icon={faBoxOpen} size="lg" />
          <span>Inventory</span>
        </button>
        <button 
          className={`${style.navBtn} ${activeTab === "ai" ? style.activeNav : ""}`} 
          onClick={() => setActiveTab("ai")}
          style={{ color: activeTab === "ai" ? theme.palette.primary : theme.palette.textSecondary }}
        >
          <FontAwesomeIcon icon={faRobot} size="lg" />
          <span>Insights</span>
        </button>
      </nav>
    </div>
  );
};

export default MobileDashboard;
