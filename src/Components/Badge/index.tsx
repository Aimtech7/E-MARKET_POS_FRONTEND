import React, { FC } from "react";

interface BadgeProps {
  type: "success" | "warning" | "danger" | "info" | "primary" | "secondary" | string;
  title: string;
}

const Badge: FC<BadgeProps> = ({ type, title }) => {
  const getBackgroundColor = () => {
    switch(type) {
      case "success": return "rgba(16, 185, 129, 0.2)";
      case "warning": return "rgba(245, 158, 11, 0.2)";
      case "danger": return "rgba(239, 68, 68, 0.2)";
      case "info": return "rgba(59, 130, 246, 0.2)";
      case "primary": return "rgba(99, 102, 241, 0.2)";
      default: return "rgba(156, 163, 175, 0.2)";
    }
  };

  const getTextColor = () => {
    switch(type) {
      case "success": return "#10b981";
      case "warning": return "#f59e0b";
      case "danger": return "#ef4444";
      case "info": return "#3b82f6";
      case "primary": return "#6366f1";
      default: return "#9ca3af";
    }
  };

  return (
    <span style={{
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "bold",
      textTransform: "uppercase",
      backgroundColor: getBackgroundColor(),
      color: getTextColor(),
      border: `1px solid ${getTextColor()}40`
    }}>
      {title}
    </span>
  );
};

export default Badge;
