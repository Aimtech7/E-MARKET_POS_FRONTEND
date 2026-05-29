import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Form, Formik } from "formik";
import useTheme from "../../context/Theme/useTheme";
import TextField from "../../Components/TextField";
import SelectField from "../../Components/SelectFeild";
import Button from "../../Components/Button";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import style from "./style.module.css";
import SearchField from "../../Components/SearchField";

const CATEGORIES = ["Rent", "Salaries", "Utilities", "Fuel", "Marketing", "Stock Purchases", "Miscellaneous"];

const ExpensePage: FC = () => {
  const theme = useTheme();
  const [cookies] = useCookies();
  const snack = useSnackbar();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, [cookies.auth.token, period]);

  const fetchExpenses = () => {
    axios
      .get("http://localhost:5500/expenses", {
        headers: { Authorization: "Bearer " + cookies.auth.token },
      })
      .then((res) => setExpenses(res.data))
      .catch((err) => console.error(err));
  };

  const fetchSummary = () => {
    axios
      .get(`http://localhost:5500/expenses/summary?period=${period}`, {
        headers: { Authorization: "Bearer " + cookies.auth.token },
      })
      .then((res) => setSummary(res.data))
      .catch((err) => console.error(err));
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={style.container} style={{ color: theme.palette.textPrimary, backgroundColor: theme.palette.paper }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Expense Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant={period === "daily" ? "primary" : "secondary"} onClick={() => setPeriod("daily")}>Daily</Button>
          <Button variant={period === "weekly" ? "primary" : "secondary"} onClick={() => setPeriod("weekly")}>Weekly</Button>
          <Button variant={period === "monthly" ? "primary" : "secondary"} onClick={() => setPeriod("monthly")}>Monthly</Button>
        </div>
      </div>

      {summary && (
        <div className={style.summaryCards}>
          <div className={style.card} style={{ backgroundColor: theme.palette.secondary, borderColor: theme.palette.shadow }}>
            <h3>Total Expenses</h3>
            <h2>${summary.grandTotal.toFixed(2)}</h2>
          </div>
          {summary.categories.slice(0, 3).map((cat: any) => (
            <div key={cat._id} className={style.card} style={{ backgroundColor: theme.palette.secondary, borderColor: theme.palette.shadow }}>
              <h3>{cat._id}</h3>
              <h2>${cat.total.toFixed(2)}</h2>
            </div>
          ))}
        </div>
      )}

      <div className={style.content}>
        <div className={style.listSection}>
          <SearchField width="100%" onChange={setSearch} />
          
          <div className={style.tableContainer} style={{ borderColor: theme.palette.secondary }}>
            <table className={style.table}>
              <thead style={{ backgroundColor: theme.palette.secondary }}>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e) => (
                  <tr key={e._id}>
                    <td>{new Date(e.date).toLocaleDateString()}</td>
                    <td>{e.title}</td>
                    <td>{e.category}</td>
                    <td style={{ color: "var(--color-danger)" }}>
                      ${e.amount.toFixed(2)}
                    </td>
                    <td>
                      <Button size="normal" variant="primary" onClick={() => setSelectedExpense(e)}>Edit</Button>
                      <Button size="normal" variant="danger" onClick={() => {
                        if(window.confirm("Delete this expense?")) {
                          axios.delete(`http://localhost:5500/expenses/${e._id}`, {
                            headers: { Authorization: "Bearer " + cookies.auth.token },
                          }).then(() => {
                            snack.onResponse({ message: "Expense deleted", status: 200 });
                            fetchExpenses();
                            fetchSummary();
                          });
                        }
                      }}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={style.formSection} style={{ backgroundColor: theme.palette.secondary + "22" }}>
          <h3>{selectedExpense ? "Edit Expense" : "Log Expense"}</h3>
          <Formik
            enableReinitialize
            initialValues={{
              title: selectedExpense?.title || "",
              category: selectedExpense?.category || "Miscellaneous",
              amount: selectedExpense?.amount || "",
              notes: selectedExpense?.notes || "",
            }}
            onSubmit={(values, { resetForm }) => {
              if (selectedExpense) {
                axios
                  .put(`http://localhost:5500/expenses/${selectedExpense._id}`, values, {
                    headers: { Authorization: "Bearer " + cookies.auth.token },
                  })
                  .then((res) => {
                    snack.onResponse({ message: "Expense updated", status: 200 });
                    fetchExpenses();
                    fetchSummary();
                    setSelectedExpense(null);
                    resetForm();
                  })
                  .catch((err) => snack.onResponse({ message: err.response?.data?.message || "Error", status: 500 }));
              } else {
                axios
                  .post("http://localhost:5500/expenses", values, {
                    headers: { Authorization: "Bearer " + cookies.auth.token },
                  })
                  .then((res) => {
                    snack.onResponse({ message: "Expense logged", status: 200 });
                    fetchExpenses();
                    fetchSummary();
                    resetForm();
                  })
                  .catch((err) => snack.onResponse({ message: err.response?.data?.message || "Error", status: 500 }));
              }
            }}
          >
            {({ setFieldValue, values }) => (
              <Form className={style.form}>
                <TextField name="title" label="Title" placeholder="e.g. Monthly Electricity" />
                
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "14px", fontWeight: "bold" }}>Category</label>
                  <select 
                    value={values.category}
                    onChange={(e) => setFieldValue("category", e.target.value)}
                    style={{ 
                      padding: "10px", 
                      borderRadius: "5px", 
                      background: theme.palette.paper, 
                      color: theme.palette.textPrimary,
                      border: `1px solid ${theme.palette.secondary}`
                    }}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <TextField name="amount" type="number" label="Amount ($)" placeholder="0.00" />
                <TextField name="notes" label="Notes" placeholder="Additional details..." />
                
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <Button type="submit" variant="success">{selectedExpense ? "Update" : "Log"} Expense</Button>
                  {selectedExpense && (
                    <Button type="button" variant="secondary" onClick={() => setSelectedExpense(null)}>Cancel</Button>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default ExpensePage;
