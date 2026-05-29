import React, { FC, MouseEventHandler, PropsWithChildren } from "react";
import useTheme from "../../context/Theme/useTheme";
import style from "./style.module.css";
interface props extends PropsWithChildren {
  variant?: "primary" | "secondary" | "warning" | "error" | "success";
  size?: "large" | "normal";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  fullWidth?: boolean;
  className?:string;
  type?:"reset" | 'button' | 'submit';
  disabled?: boolean;
}
const Button: FC<props> = ({
  children,
  variant = "primary",
  size = "normal",
  onClick,
  type= 'button',
  fullWidth = false,
  className,
  disabled = false,
}) => {
  const theme = useTheme();
  const styles = {
    backgroundColor: "",
    width: "auto",
    padding: "0.7em 1em",
    color: theme.palette.textAction,
    boxShadow: " 0 2px 4px" + theme.palette.shadow,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  };
  if (variant === "primary") styles.backgroundColor = theme.palette.primary;
  else if (variant === "secondary")
    styles.backgroundColor = theme.palette.secondary;
  else if (variant === "error") styles.backgroundColor = theme.palette.error;
  else if (variant === "warning")
    styles.backgroundColor = theme.palette.warning;
  else if (variant === "success")
    styles.backgroundColor = "#2ecc71";

  if (size === "large") styles.padding = "1em 2em";
  else styles.padding = "0.7em 1em";
  if (fullWidth) styles.width = "100%";
  return (
    <button type={type} className={style.btn +" " + className} onClick={onClick} style={styles} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
