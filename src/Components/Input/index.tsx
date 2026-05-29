import { ChangeEventHandler, FC } from "react";
import style from "./style.module.css";
import useTheme from "../../context/Theme/useTheme";

interface props {
  placeholder?: string;
  width?: string;
  color?: string;
  type?: string;
  id?: string;
  value?: string | number;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: ChangeEventHandler;
  error?: boolean;
}

const Input: FC<props> = ({
  placeholder,
  width,
  color,
  type = "text",
  id,
  name,
  value,
  disabled = false,
  readOnly = false,
  onChange,
  error = false,
}) => {
  const theme = useTheme();
  
  return (
    <input
      style={{
        width: width ? width : "100%",
        border: `1px solid ${color ? color : theme.palette.secondary}`,
        backgroundColor: theme.palette.paper,
        color: theme.palette.textPrimary,
      }}
      name={name}
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={`${style.input} ${error ? style.error : ""}`}
    />
  );
};

export default Input;
