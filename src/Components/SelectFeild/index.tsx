import React, { FC } from "react";
import { useField } from "formik";
import Select from "../Select";

interface props {
  options: { key: string; value: string }[];
  width?: string;
  name: string;
  label?: string;
}

const SelectField: FC<props> = ({ options, width, name, label }) => {
  const [field, meta] = useField(name);
  
  return (
    <div style={{ width: width ? width : "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
      {label && <label htmlFor={name} style={{ fontSize: "14px", fontWeight: "bold" }}>{label}</label>}
      <Select
        name={field.name}
        value={field.value}
        onChange={field.onChange}
        options={options}
        width="100%"
      />
      {meta.error && meta.touched && (
        <span style={{ color: "var(--color-danger)", fontSize: "12px", textAlign: "left" }}>
          {meta.error}
        </span>
      )}
    </div>
  );
};

export default SelectField;
