import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot, faCheckCircle, faExclamationTriangle, faInfoCircle, faArrowTrendUp, faArrowTrendDown } from "@fortawesome/free-solid-svg-icons";

const AIMAssistantWidget: FC = () => {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cookies] = useCookies();
  const theme = useTheme();

  useEffect(() => {
    axios
      .get("/analytics/ai/insights", {
        headers: { Authorization: "barear " + cookies.auth.token },
      })
      .then((res) => {
        setInsights(res.data.insights);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [cookies.auth.token]);

  const getIcon = (type: string, msg: string) => {
    if (type === "success") return <FontAwesomeIcon icon={faCheckCircle} color="var(--color-success)" />;
    if (type === "warning") return <FontAwesomeIcon icon={faExclamationTriangle} color="orange" />;
    if (type === "danger") return <FontAwesomeIcon icon={faExclamationTriangle} color="red" />;
    if (msg.includes("up")) return <FontAwesomeIcon icon={faArrowTrendUp} color="var(--color-success)" />;
    if (msg.includes("down")) return <FontAwesomeIcon icon={faArrowTrendDown} color="red" />;
    return <FontAwesomeIcon icon={faInfoCircle} color="var(--color-primary)" />;
  };

  return (
    <div style={{ backgroundColor: theme.palette.paper, padding: "15px", borderRadius: "8px", marginTop: "20px", border: `1px solid ${theme.palette.secondary}` }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "10px", margin: "0 0 15px 0", color: theme.palette.primary }}>
        <FontAwesomeIcon icon={faRobot} size="lg" /> AIM Business Assistant
      </h3>
      
      {loading ? (
        <p>Analyzing your store data...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {insights.map((insight, idx) => (
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
              <div style={{ marginTop: "2px", fontSize: "1.2rem" }}>
                {getIcon(insight.type, insight.message)}
              </div>
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
  );
};

export default AIMAssistantWidget;
