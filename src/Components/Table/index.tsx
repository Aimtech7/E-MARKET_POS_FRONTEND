import React, { FC } from "react";
import useTheme from "../../context/Theme/useTheme";

interface TableProps {
  headers: React.ReactNode[];
  data: React.ReactNode[][];
  loading?: boolean;
}

const Table: FC<TableProps> = ({ headers, data, loading }) => {
  const theme = useTheme();

  return (
    <div style={{ overflowX: "auto", width: "100%", borderRadius: "var(--radius-md)", border: `1px solid rgba(255, 255, 255, 0.1)` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
        <thead style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
          <tr>
            {headers.map((header, index) => (
              <th key={index} style={{ padding: "12px 16px", borderBottom: `1px solid rgba(255, 255, 255, 0.1)`, fontWeight: "bold" }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: "20px", textAlign: "center", opacity: 0.7 }}>
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: "20px", textAlign: "center", opacity: 0.7 }}>
                No data available.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ transition: "background-color 0.2s" }} onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")} onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ padding: "12px 16px", borderBottom: `1px solid rgba(255, 255, 255, 0.05)` }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
