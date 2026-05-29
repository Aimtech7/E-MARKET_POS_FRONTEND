import React, { FC, useState, useEffect } from "react";
import useTheme from "../../context/Theme/useTheme";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCube,
  faGears,
  faHome,
  faRuler,
  faSignOut,
  faTag,
  faUser,
  faChartLine,
  faWarehouse,
  faReceipt,
  faDatabase,
  faCalendarCheck,
  faStore,
  faChevronLeft,
  faChevronRight
} from "@fortawesome/free-solid-svg-icons";
import { useCookies } from "react-cookie";
import style from "./style.module.css";

const Navbar: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const location = useLocation();
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (cookies.auth?.token) {
      import("axios").then(axios => {
        axios.default.get("http://localhost:5500/analytics/low-stock", {
          headers: { Authorization: "barear " + cookies.auth.token }
        }).then(res => {
          setLowStockCount(res.data.lowStockCount || 0);
        }).catch(err => console.error(err));
      });
    }
  }, [cookies.auth?.token]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={`${style.sidebar} ${collapsed ? style.sidebarCollapsed : ""}`}>
      <div className={style.brand}>
        <FontAwesomeIcon icon={faStore} className={style.brandIcon} />
        <span className={style.brandName}>EMMARKET</span>
        <button className={style.collapseBtn} onClick={() => setCollapsed(!collapsed)} style={{ marginLeft: "auto" }}>
          <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
        </button>
      </div>

      <nav className={style.navLinks}>
        <Link to={"/"} title="Home" className={`${style.link} ${isActive("/") ? style.activeLink : ""}`}>
          <FontAwesomeIcon className={style.linkIcon} icon={faHome} />
          <span className={style.linkLabel}>Home</span>
        </Link>
        <Link to={"/auth"} title="Login" className={`${style.link} ${isActive("/auth") ? style.activeLink : ""}`}>
          <FontAwesomeIcon className={style.linkIcon} icon={faUser} />
          <span className={style.linkLabel}>Login</span>
        </Link>
        
        {cookies.auth?.admin && (
          <>
            <Link to={"/dashboard"} title="Dashboard" className={`${style.link} ${isActive("/dashboard") ? style.activeLink : ""}`}>
              <FontAwesomeIcon className={style.linkIcon} icon={faChartLine} />
              <span className={style.linkLabel}>Dashboard</span>
            </Link>
            <Link to={"/product"} title="Products" className={`${style.link} ${isActive("/product") ? style.activeLink : ""}`}>
              <FontAwesomeIcon className={style.linkIcon} icon={faCube} />
              <span className={style.linkLabel}>Products</span>
            </Link>
            <Link to={"/category"} title="Categories" className={`${style.link} ${isActive("/category") ? style.activeLink : ""}`}>
              <FontAwesomeIcon className={style.linkIcon} icon={faTag} />
              <span className={style.linkLabel}>Categories</span>
            </Link>
            <Link to={"/unit-measure"} title="Unit of Measure" className={`${style.link} ${isActive("/unit-measure") ? style.activeLink : ""}`}>
              <FontAwesomeIcon className={style.linkIcon} icon={faRuler} />
              <span className={style.linkLabel}>Units</span>
            </Link>
            <Link to={"/reports"} title="Reports" className={`${style.link} ${isActive("/reports") ? style.activeLink : ""}`}>
              <FontAwesomeIcon className={style.linkIcon} icon={faChartLine} />
              <span className={style.linkLabel}>Reports</span>
            </Link>
            <Link to={"/settings"} title="Settings" className={`${style.link} ${isActive("/settings") ? style.activeLink : ""}`}>
              <FontAwesomeIcon className={style.linkIcon} icon={faGears} />
              <span className={style.linkLabel}>Settings</span>
            </Link>
            <Link to={"/backups"} title="Backups" className={`${style.link} ${isActive("/backups") ? style.activeLink : ""}`}>
              <FontAwesomeIcon className={style.linkIcon} icon={faDatabase} />
              <span className={style.linkLabel}>Backups</span>
            </Link>
          </>
        )}
        
        <Link to={"/inventory"} title="Inventory" className={`${style.link} ${isActive("/inventory") ? style.activeLink : ""}`}>
          <FontAwesomeIcon className={style.linkIcon} icon={faWarehouse} />
          <span className={style.linkLabel}>Inventory</span>
          {lowStockCount > 0 && <span className={style.badge}>{lowStockCount}</span>}
        </Link>
        <Link to={"/sales-history"} title="Sales History" className={`${style.link} ${isActive("/sales-history") ? style.activeLink : ""}`}>
          <FontAwesomeIcon className={style.linkIcon} icon={faChartLine} />
          <span className={style.linkLabel}>Sales</span>
        </Link>
        <Link to={"/closures"} title="Closures" className={`${style.link} ${isActive("/closures") ? style.activeLink : ""}`}>
          <FontAwesomeIcon className={style.linkIcon} icon={faCalendarCheck} />
          <span className={style.linkLabel}>Closures</span>
        </Link>
        <Link to={"/receipts"} title="Receipts" className={`${style.link} ${isActive("/receipts") ? style.activeLink : ""}`}>
          <FontAwesomeIcon className={style.linkIcon} icon={faReceipt} />
          <span className={style.linkLabel}>Receipts</span>
        </Link>
      </nav>

      <div className={style.userProfile}>
        <div className={style.avatar}>
          <FontAwesomeIcon icon={faUser} />
        </div>
        <div className={style.userInfo}>
          <p className={style.userName}>{cookies.auth?.username || "Guest"}</p>
          <p className={style.userRole}>{cookies.auth?.admin ? "Administrator" : "Cashier"}</p>
        </div>
        <Link to={"/logout"} title="Logout" className={style.collapseBtn} style={{ marginLeft: "auto" }}>
          <FontAwesomeIcon icon={faSignOut} />
        </Link>
      </div>
    </aside>
  );
};
export default Navbar;
