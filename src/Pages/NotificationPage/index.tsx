import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import useTheme from "../../context/Theme/useTheme";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import Button from "../../Components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckDouble, faCircle, faLink } from "@fortawesome/free-solid-svg-icons";

const NotificationPage: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = () => {
    axios.get("/notifications", {
      headers: { Authorization: "barear " + cookies.auth?.token }
    }).then(res => {
      setNotifications(res.data);
    }).catch(err => {
      console.error(err);
      snackbar.onResponse({ message: "Failed to load notifications", status: 500 });
    });
  };

  useEffect(() => {
    if (cookies.auth?.token) fetchNotifications();
  }, [cookies.auth?.token]);

  const markAsRead = (id: string) => {
    axios.put(`/notifications/${id}/read`, {}, {
      headers: { Authorization: "barear " + cookies.auth?.token }
    }).then(() => {
      fetchNotifications();
    }).catch(console.error);
  };

  const markAllAsRead = () => {
    axios.put(`/notifications/mark-all-read`, {}, {
      headers: { Authorization: "barear " + cookies.auth?.token }
    }).then(() => {
      fetchNotifications();
      snackbar.onResponse({ message: "All notifications marked as read", status: 200 });
    }).catch(console.error);
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "warning": return theme.palette.warning || "#ffcc00";
      case "alert": return theme.palette.error || "#ff4444";
      case "success": return theme.palette.success || "#00C851";
      default: return theme.palette.primary;
    }
  };

  return (
    <div style={{ padding: "40px", color: theme.palette.textPrimary, backgroundColor: theme.palette.paper, minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2>Notifications</h2>
        <Button onClick={markAllAsRead}>
          <FontAwesomeIcon icon={faCheckDouble} style={{ marginRight: "8px" }} />
          Mark All Read
        </Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {notifications.length === 0 ? (
          <p>No notifications found.</p>
        ) : (
          notifications.map(notif => (
            <div key={notif._id} style={{
              padding: "15px",
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              borderRadius: "8px",
              backgroundColor: notif.isRead ? "transparent" : "rgba(255, 255, 255, 0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                {!notif.isRead && <FontAwesomeIcon icon={faCircle} style={{ color: getNotificationColor(notif.type), fontSize: "0.6rem" }} />}
                <div>
                  <h4 style={{ margin: 0 }}>{notif.title}</h4>
                  <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: "gray" }}>{notif.message}</p>
                  <small style={{ color: "gray" }}>{new Date(notif.timestamp).toLocaleString()}</small>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "10px" }}>
                {notif.link && (
                  <Button variant="secondary" onClick={() => navigate(notif.link)}>
                    <FontAwesomeIcon icon={faLink} />
                  </Button>
                )}
                {!notif.isRead && (
                  <Button variant="primary" onClick={() => markAsRead(notif._id)}>
                    Mark Read
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
