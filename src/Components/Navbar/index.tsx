import React, { FC } from "react";
import useTheme from "../../context/Theme/useTheme";
import { Link } from "react-router-dom";
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
} from "@fortawesome/free-solid-svg-icons";
import { useCookies } from "react-cookie";
import style from "./style.module.css";
const Navbar: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const [lowStockCount, setLowStockCount] = React.useState<number>(0);

  React.useEffect(() => {
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

  return (
    <header
      className={style.header}
      style={{ backgroundColor: theme.palette.primary }}
    >
      <Link to={"/"} title="home">
        <FontAwesomeIcon className={style.link} icon={faHome} color="white" />
      </Link>
      <Link to={"/auth"} title="login">
        <FontAwesomeIcon className={style.link} icon={faUser} color="white" />
      </Link>
      {cookies.auth?.admin && (
        <>
          <Link to={"/category"}  title="category">
            <FontAwesomeIcon className={style.link} icon={faTag} color="white" />
          </Link>
          <Link to={"/unit-measure"}  title="unit of measure">
            <FontAwesomeIcon className={style.link} icon={faRuler} color="white" />
          </Link>
          <Link to={"/product"}  title="product">
            <FontAwesomeIcon className={style.link} icon={faCube} color="white" />
          </Link>
          <Link to={"/dashboard"} title="dashboard">
            <FontAwesomeIcon className={style.link} icon={faGears} color="white" />
          </Link>
          <Link to={"/reports"} title="reports">
            <FontAwesomeIcon className={style.link} icon={faChartLine} color="white" />
          </Link>
          <Link to={"/settings"} title="store settings">
            <FontAwesomeIcon className={style.link} icon={faGears} color="white" />
          </Link>
          <Link to={"/backups"} title="database backups">
            <FontAwesomeIcon className={style.link} icon={faDatabase} color="white" />
          </Link>
        </>
      )}
      <Link to={"/closures"} title="end of day closures">
        <FontAwesomeIcon className={style.link} icon={faCalendarCheck} color="white" />
      </Link>
      <Link to={"/sales-history"} title="sales history">
        <FontAwesomeIcon className={style.link} icon={faChartLine} color="white" />
      </Link>
      <Link to={"/receipts"} title="receipts">
        <FontAwesomeIcon className={style.link} icon={faReceipt} color="white" />
      </Link>
      <Link to={"/inventory"} title="inventory" style={{ position: "relative" }}>
        <FontAwesomeIcon className={style.link} icon={faWarehouse} color="white" />
        {lowStockCount > 0 && (
          <span style={{
            position: "absolute",
            top: "-5px",
            right: "-10px",
            backgroundColor: "red",
            color: "white",
            borderRadius: "50%",
            padding: "2px 6px",
            fontSize: "10px",
            fontWeight: "bold"
          }}>
            {lowStockCount}
          </span>
        )}
      </Link>
      <Link to={"/logout"} title="logout">
        <FontAwesomeIcon className={style.link} icon={faSignOut} color="white" />
      </Link>
    </header>
  );
};
export default Navbar;
