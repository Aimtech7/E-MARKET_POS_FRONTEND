import React, { FC, PropsWithChildren } from "react";
import useTheme from "../context/Theme/useTheme";
import Navbar from "../Components/Navbar";
import style from './style.module.css'

const Layout: FC<PropsWithChildren> = ({ children }) => {
  const theme = useTheme();

  return <div style={{ backgroundColor: theme.palette.background }} className={style.layout}>
    <Navbar />
    <div className={style.content}>
      {children}
    </div>
  </div>;
};

export default Layout;
