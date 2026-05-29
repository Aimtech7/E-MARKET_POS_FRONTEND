import React, { FC } from "react";
import { useCookies } from "react-cookie";
import { Navigate } from "react-router-dom";

interface props {
  children: React.ReactNode;
}
const AdminGuard: FC<props> = ({ children }) => {
  const [cookies] = useCookies();
  
  if (!cookies.auth || !cookies.auth.admin) {
    return <Navigate to={"/"} replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;
