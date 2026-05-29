import React, { ChangeEventHandler, FC } from "react";
import style from "./style.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import useTheme from "../../context/Theme/useTheme";
interface props {
  options: { key: string; value: string }[];
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  width?: string;
  name?: string;
  value?: string | number;
}
const Select: FC<props> = ({ options, onChange, width, name, value }) => {
  const theme = useTheme();

  return (
    <div
      className={style.container}
      style={{
        border: "1px solid " + theme.palette.secondary,
        backgroundColor: theme.palette.paper,
        width: width ? width : "100%",
      }}
    >
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={style.select}
        style={{ color: theme.palette.textPrimary }}
      >
        {options.map((op) => (
          <option
            key={op.key}
            value={op.key}
            style={{ backgroundColor: theme.palette.paper }}
          >
            {op.value}
          </option>
        ))}
      </select>
      <FontAwesomeIcon
        icon={faArrowDown}
        className={style.arrowIcon}
        color={theme.palette.textSecondary}
      />
    </div>
  );
};

export default Select;
