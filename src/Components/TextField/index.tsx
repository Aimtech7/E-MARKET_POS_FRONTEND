import { FC } from "react";
import { useField } from "formik";
import Input from "../Input";
import useTheme from "../../context/Theme/useTheme";

interface props {
  placeholder?: string;
  width?: string;
  color?: string;
  type?: string;
  id?: string;
  name: string;
  label?: string;
}

const TextField: FC<props> = ({
  placeholder,
  width,
  color,
  type = "text",
  id,
  name,
  label,
}) => {
  const [field, meta] = useField(name);
  const theme = useTheme();
  
  return (
    <div style={{ width: width ? width : "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
      {label && <label htmlFor={id || name} style={{ fontSize: "14px", fontWeight: "bold" }}>{label}</label>}
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        width="100%"
        color={color}
        value={field.value}
        onChange={field.onChange}
        error={!!meta.error && meta.touched}
      />
      {meta.error && meta.touched && (
        <span style={{ color: "var(--color-danger)", fontSize: "12px", textAlign: "left" }}>
          {meta.error}
        </span>
      )}
    </div>
  );
};

export default TextField;
