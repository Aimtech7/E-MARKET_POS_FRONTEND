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
} from "@fortawesome/free-solid-svg-icons";
import { useCookies } from "react-cookie";
import style from "./style.module.css";
const Navbar: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
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
      <Link to={"/sales-history"} title="sales history">
        <FontAwesomeIcon className={style.link} icon={faChartLine} color="white" />
      </Link>
      <Link to={"/receipts"} title="receipts">
        <FontAwesomeIcon className={style.link} icon={faReceipt} color="white" />
      </Link>
      <Link to={"/inventory"} title="inventory">
        <FontAwesomeIcon className={style.link} icon={faWarehouse} color="white" />
      </Link>
      <Link to={"/logout"} title="logout">
        <FontAwesomeIcon className={style.link} icon={faSignOut} color="white" />
      </Link>
    </header>
  );
};
export default Navbar;
