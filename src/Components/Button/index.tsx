import React, { FC, MouseEventHandler, PropsWithChildren } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import style from "./style.module.css";

interface props extends PropsWithChildren {
  variant?: "primary" | "secondary" | "warning" | "error" | "success";
  size?: "large" | "normal";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  fullWidth?: boolean;
  className?: string;
  type?: "reset" | "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
}

const Button: FC<props> = ({
  children,
  variant = "primary",
  size = "normal",
  onClick,
  type = "button",
  fullWidth = false,
  className = "",
  disabled = false,
  loading = false,
}) => {
  const classes = [
    style.btn,
    style[`variant_${variant}`],
    style[`size_${size}`],
    className,
  ].filter(Boolean).join(" ");

  const styles = fullWidth ? { width: "100%" } : {};

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      style={styles}
      disabled={disabled || loading}
    >
      {loading && <FontAwesomeIcon icon={faCircleNotch} className={style.spinner} />}
      {children}
    </button>
  );
};

export default Button;
