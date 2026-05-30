import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Form, Formik } from "formik";
import useTheme from "../../context/Theme/useTheme";
import TextField from "../../Components/TextField";
import Button from "../../Components/Button";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import style from "./style.module.css";
import SearchField from "../../Components/SearchField";

const CustomerPage: FC = () => {
  const theme = useTheme();
  const [cookies] = useCookies();
  const snack = useSnackbar();

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
  }, [cookies.auth.token]);

  const fetchCustomers = () => {
    axios
      .get("http://localhost:5500/customer", {
        headers: { Authorization: "Bearer " + cookies.auth.token },
      })
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error(err));
  };

  const loadHistoryAndDebts = (customerId: string) => {
    axios
      .get(`http://localhost:5500/customer/${customerId}/history`, {
        headers: { Authorization: "Bearer " + cookies.auth.token },
      })
      .then((res) => setHistory(res.data));

    axios
      .get(`http://localhost:5500/debts/customer/${customerId}`, {
        headers: { Authorization: "Bearer " + cookies.auth.token },
      })
      .then((res) => setDebts(res.data));

    axios
      .get(`http://localhost:5500/loyalty/customer/${customerId}`, {
        headers: { Authorization: "Bearer " + cookies.auth.token },
      })
      .then((res) => setLoyalty(res.data))
      .catch(() => setLoyalty(null));
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className={style.container} style={{ color: theme.palette.textPrimary, backgroundColor: theme.palette.paper }}>
      <h2>Customer Management</h2>

      <div className={style.content}>
        <div className={style.listSection}>
          <SearchField width="100%" onChange={setSearch} />
          
          <div className={style.tableContainer} style={{ borderColor: theme.palette.secondary }}>
            <table className={style.table}>
              <thead style={{ backgroundColor: theme.palette.secondary }}>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.phone}</td>
                    <td style={{ color: c.balance > 0 ? "var(--color-danger)" : "inherit" }}>
                      ${c.balance.toFixed(2)}
                    </td>
                    <td>
                      <Button size="normal" variant="primary" onClick={() => setSelectedCustomer(c)}>Edit</Button>
                      <Button 
                        size="normal" 
                        variant="warning" 
                        onClick={() => {
                          setSelectedCustomer(c);
                          setShowHistory(true);
                          loadHistoryAndDebts(c._id);
                        }}
                      >
                        Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={style.formSection} style={{ backgroundColor: theme.palette.secondary + "22" }}>
          <h3>{selectedCustomer ? "Edit Customer" : "Add Customer"}</h3>
          <Formik
            enableReinitialize
            initialValues={{
              name: selectedCustomer?.name || "",
              phone: selectedCustomer?.phone || "",
              email: selectedCustomer?.email || "",
              address: selectedCustomer?.address || "",
            }}
            onSubmit={(values, { resetForm }) => {
              if (selectedCustomer) {
                axios
                  .put(`http://localhost:5500/customer/${selectedCustomer._id}`, values, {
                    headers: { Authorization: "Bearer " + cookies.auth.token },
                  })
                  .then((res) => {
                    snack.onResponse({ message: "Customer updated", status: 200 });
                    fetchCustomers();
                    setSelectedCustomer(null);
                    resetForm();
                  })
                  .catch((err) => snack.onResponse({ message: err.response?.data?.message || "Error", status: 500 }));
              } else {
                axios
                  .post("http://localhost:5500/customer/new", values, {
                    headers: { Authorization: "Bearer " + cookies.auth.token },
                  })
                  .then((res) => {
                    snack.onResponse({ message: "Customer added", status: 200 });
                    fetchCustomers();
                    resetForm();
                  })
                  .catch((err) => snack.onResponse({ message: err.response?.data?.message || "Error", status: 500 }));
              }
            }}
          >
            <Form className={style.form}>
              <TextField name="name" label="Full Name" placeholder="e.g. John Doe" />
              <TextField name="phone" label="Phone" placeholder="e.g. +1 234 567 89" />
              <TextField name="email" label="Email" placeholder="john@example.com" />
              <TextField name="address" label="Address" placeholder="123 Main St" />
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <Button type="submit" variant="success">{selectedCustomer ? "Update" : "Add"} Customer</Button>
                {selectedCustomer && (
                  <Button type="button" variant="secondary" onClick={() => setSelectedCustomer(null)}>Cancel</Button>
                )}
              </div>
            </Form>
          </Formik>
        </div>
      </div>

      {showHistory && selectedCustomer && (
        <div className={style.modalOverlay} onClick={() => setShowHistory(false)}>
          <div className={style.modalContent} onClick={(e) => e.stopPropagation()} style={{ backgroundColor: theme.palette.paper, borderColor: theme.palette.secondary }}>
            <div className={style.modalHeader}>
              <h2>{selectedCustomer.name}'s Profile</h2>
              <Button variant="danger" onClick={() => setShowHistory(false)}>Close</Button>
            </div>
            
            <div className={style.profileGrid}>
              <div className={style.historySection}>
                <h3>Purchase History</h3>
                <table className={style.table}>
                  <thead style={{ backgroundColor: theme.palette.secondary }}>
                    <tr>
                      <th>Date</th>
                      <th>Invoice #</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h._id}>
                        <td>{new Date(h.timestamp).toLocaleDateString()}</td>
                        <td>{h.invoiceNumber}</td>
                        <td>${h.grandTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                    {history.length === 0 && <tr><td colSpan={3}>No purchases found</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className={style.debtsSection}>
                <h3>Credit / Debts</h3>
                <table className={style.table}>
                  <thead style={{ backgroundColor: theme.palette.secondary }}>
                    <tr>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debts.map((d) => (
                      <tr key={d._id}>
                        <td>{new Date(d.timestamp).toLocaleDateString()}</td>
                        <td>${d.amount.toFixed(2)}</td>
                        <td style={{ color: d.balance > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                          ${d.balance.toFixed(2)}
                        </td>
                        <td>{d.status}</td>
                      </tr>
                    ))}
                    {debts.length === 0 && <tr><td colSpan={4}>No debts found</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className={style.loyaltySection} style={{ gridColumn: "1 / -1", marginTop: "20px" }}>
                <h3>Loyalty Program</h3>
                {loyalty ? (
                  <div style={{ display: "flex", gap: "20px", padding: "15px", backgroundColor: theme.palette.secondary + "44", borderRadius: "8px" }}>
                    <div><strong>Tier:</strong> <span style={{ color: "var(--color-warning)" }}>{loyalty.tier}</span></div>
                    <div><strong>Points:</strong> {loyalty.points}</div>
                    <div><strong>Total Lifetime Spent:</strong> ${loyalty.totalSpent?.toFixed(2)}</div>
                  </div>
                ) : (
                  <div style={{ padding: "15px", backgroundColor: theme.palette.secondary + "44", borderRadius: "8px" }}>
                    Customer is not enrolled or hasn't earned points yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPage;
