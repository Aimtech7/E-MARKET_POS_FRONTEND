import React, { FC, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import useTheme from "../../context/Theme/useTheme";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import Button from "../../Components/Button";
import Input from "../../Components/Input";
import style from "./style.module.css";

interface RefundItemInput {
  product: string;
  productName: string;
  maxQty: number;
  qty: number;
  price: number;
}

const SalesPage: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const snackbar = useSnackbar();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    grossSales: 0,
    totalRefunds: 0,
    netSales: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Filters state
  const [cashierFilter, setCashierFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Refund Modal state
  const [isRefundOpen, setIsRefundOpen] = useState<boolean>(false);
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);
  const [refundItems, setRefundItems] = useState<RefundItemInput[]>([]);
  const [refundReason, setRefundReason] = useState<string>("");
  const [refundSubmitting, setRefundSubmitting] = useState<boolean>(false);

  const fetchSalesLogs = async () => {
    setLoading(true);
    const token = cookies.auth?.token;
    try {
      // Build query string
      let params = [];
      if (cashierFilter) params.push(`cashier=${cashierFilter}`);
      if (paymentFilter) params.push(`paymentMethod=${paymentFilter}`);
      if (typeFilter) params.push(`type=${typeFilter}`);
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      const queryStr = params.length > 0 ? `?${params.join("&")}` : "";

      const res = await axios.get(`/transaction${queryStr}`, {
        headers: { Authorization: "barear " + token },
      });
      setTransactions(res.data);
    } catch (err: any) {
      snackbar.onResponse({
        message: err.response?.data?.message || "Failed to fetch transaction logs.",
        status: err.response?.status || 500,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    const token = cookies.auth?.token;
    try {
      const res = await axios.get("/transaction/analytics", {
        headers: { Authorization: "barear " + token },
      });
      setAnalytics(res.data);
    } catch (err: any) {
      console.error("Failed to load analytics summaries:", err);
    }
  };

  useEffect(() => {
    fetchSalesLogs();
    fetchAnalytics();
  }, [cookies.auth?.token, cashierFilter, paymentFilter, typeFilter, startDate, endDate]);

  const handleOpenRefund = (txn: any) => {
    // We can only refund transaction type "sale"
    if (txn.type !== "sale") return;

    const invoice = txn.invoice;
    if (!invoice || !invoice.cart) {
      snackbar.onResponse({ message: "Invoice or cart details are unavailable for this transaction.", status: 400 });
      return;
    }

    const items: RefundItemInput[] = invoice.cart.products.map((p: any) => ({
      product: p.product._id,
      productName: p.product.productName,
      maxQty: p.qty,
      qty: 0, // start refund quantity at 0
      price: p.product.productPrice,
    }));

    setSelectedTxn(txn);
    setRefundItems(items);
    setRefundReason("");
    setIsRefundOpen(true);
  };

  const handleQtyChange = (idx: number, val: number) => {
    const updated = [...refundItems];
    const target = updated[idx];
    if (val < 0) return;
    if (val > target.maxQty) {
      snackbar.onResponse({ message: `Cannot refund more than purchased quantity of ${target.maxQty}.`, status: 400 });
      return;
    }
    target.qty = val;
    setRefundItems(updated);
  };

  const handleProcessRefund = async () => {
    const itemsToRefund = refundItems.filter((i) => i.qty > 0);
    if (itemsToRefund.length === 0) {
      snackbar.onResponse({ message: "Please select at least one item to refund by setting Qty > 0.", status: 400 });
      return;
    }

    setRefundSubmitting(true);
    const token = cookies.auth?.token;

    try {
      await axios.post(
        "/transaction/refund",
        {
          invoiceId: selectedTxn.invoice._id,
          refundedItems: itemsToRefund.map((i) => ({ product: i.product, qty: i.qty })),
          reason: refundReason,
        },
        {
          headers: { Authorization: "barear " + token },
        }
      );

      snackbar.onResponse({ message: "Refund transaction processed successfully.", status: 201 });
      setIsRefundOpen(false);
      fetchSalesLogs();
      fetchAnalytics();
    } catch (err: any) {
      snackbar.onResponse({
        message: err.response?.data?.message || "Failed to process refund.",
        status: err.response?.status || 500,
      });
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      snackbar.onResponse({ message: "No data available to export.", status: 400 });
      return;
    }

    // Build CSV Content
    const headers = ["Transaction No", "Date", "Cashier", "Payment Method", "Type", "Total Amount"];
    const rows = transactions.map((t) => [
      t.transactionNumber,
      new Date(t.timestamp).toLocaleDateString() + " " + new Date(t.timestamp).toLocaleTimeString(),
      t.cashier,
      t.paymentMethod,
      t.type,
      t.totalAmount,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EMMARKET_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className={style.container} style={{ backgroundColor: theme.palette.paper, color: theme.palette.textPrimary }}>
      <div className={style.header}>
        <h1>Sales History & Logs</h1>
        <div className={style.headerActions}>
          <Button onClick={handleExportCSV} variant="secondary">Export CSV</Button>
          <Button onClick={handlePrintReport} variant="warning">Print Report</Button>
        </div>
      </div>

      {/* Analytics Summary Widgets */}
      <div className={style.analyticsGrid}>
        <div className={style.card} style={{ backgroundColor: theme.palette.primary + "11", borderLeft: `4px solid ${theme.palette.primary}` }}>
          <h3>Gross Sales</h3>
          <p className={style.statValue}>Ksh {(analytics.grossSales || 0).toFixed(2)}</p>
        </div>
        <div className={style.card} style={{ backgroundColor: theme.palette.error + "11", borderLeft: `4px solid ${theme.palette.error}` }}>
          <h3>Total Refunds</h3>
          <p className={style.statValue}>-Ksh {(analytics.totalRefunds || 0).toFixed(2)}</p>
        </div>
        <div className={style.card} style={{ backgroundColor: "#2e7d3211", borderLeft: "4px solid #2e7d32" }}>
          <h3>Net Sales</h3>
          <p className={style.statValue} style={{ color: "#2e7d32" }}>Ksh {(analytics.netSales || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={style.filters}>
        <div className={style.filterGroup}>
          <label>Cashier</label>
          <Input
            value={cashierFilter}
            onChange={(e: any) => setCashierFilter(e.target.value)}
            placeholder="Search Cashier"
            width="100%"
          />
        </div>

        <div className={style.filterGroup}>
          <label>Payment Method</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className={style.select}
            style={{
              backgroundColor: theme.palette.paper,
              color: theme.palette.textPrimary,
              borderColor: theme.palette.secondary,
            }}
          >
            <option value="">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Mobile">Mobile Payment</option>
            <option value="Credit">Store Credit</option>
          </select>
        </div>

        <div className={style.filterGroup}>
          <label>Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={style.select}
            style={{
              backgroundColor: theme.palette.paper,
              color: theme.palette.textPrimary,
              borderColor: theme.palette.secondary,
            }}
          >
            <option value="">All Transactions</option>
            <option value="sale">Sale</option>
            <option value="refund">Refund</option>
            <option value="void">Void</option>
          </select>
        </div>

        <div className={style.filterGroup}>
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={style.dateInput}
            style={{
              backgroundColor: theme.palette.paper,
              color: theme.palette.textPrimary,
              borderColor: theme.palette.secondary,
            }}
          />
        </div>

        <div className={style.filterGroup}>
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={style.dateInput}
            style={{
              backgroundColor: theme.palette.paper,
              color: theme.palette.textPrimary,
              borderColor: theme.palette.secondary,
            }}
          />
        </div>
      </div>

      {/* Transaction Logs Table */}
      <div className={style.tableWrapper}>
        {loading ? (
          <p className={style.loading}>Loading transaction history...</p>
        ) : transactions.length === 0 ? (
          <p className={style.empty}>No transaction records match the specified filters.</p>
        ) : (
          <table className={style.table}>
            <thead>
              <tr style={{ color: theme.palette.textSecondary }}>
                <th>Txn Number</th>
                <th>Date & Time</th>
                <th>Cashier</th>
                <th>Payment</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn._id} style={{ borderBottom: `1px solid ${theme.palette.secondary}22` }}>
                  <td className={style.bold}>{txn.transactionNumber}</td>
                  <td>{new Date(txn.timestamp).toLocaleString()}</td>
                  <td>{txn.cashier}</td>
                  <td>{txn.paymentMethod}</td>
                  <td>
                    <span className={`${style.badge} ${style[txn.type]}`}>
                      {txn.type}
                    </span>
                  </td>
                  <td className={`${style.amount} ${style[txn.type]}`}>
                    Ksh {txn.totalAmount.toFixed(2)}
                  </td>
                  <td>
                    {txn.type === "sale" ? (
                      <button
                        onClick={() => handleOpenRefund(txn)}
                        className={style.refundBtn}
                        style={{ borderColor: theme.palette.error, color: theme.palette.error }}
                      >
                        Refund
                      </button>
                    ) : (
                      <span className={style.disabledText}>No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Refund Modal Overlay */}
      {isRefundOpen && selectedTxn && (
        <div className={style.overlay}>
          <div className={style.modal} style={{ backgroundColor: theme.palette.paper }}>
            <div className={style.modalHeader}>
              <h3>Process Refund - {selectedTxn.transactionNumber}</h3>
              <button className={style.closeBtn} onClick={() => setIsRefundOpen(false)}>&times;</button>
            </div>
            <div className={style.modalBody}>
              <p className={style.modalSubText}>Select quantities and items to return to stock.</p>
              
              <div className={style.refundList}>
                {refundItems.map((item, idx) => (
                  <div key={item.product} className={style.refundRow} style={{ borderBottom: `1px solid ${theme.palette.secondary}22` }}>
                    <div className={style.rowProductInfo}>
                      <span className={style.bold}>{item.productName}</span>
                      <span className={style.rowSubText}>Price: Ksh {item.price.toFixed(2)} | Max: {item.maxQty}</span>
                    </div>
                    <div className={style.rowQtyActions}>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(idx, item.qty - 1)}
                        className={style.qtyBtn}
                      >
                        -
                      </button>
                      <span className={style.qtyVal}>{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(idx, item.qty + 1)}
                        className={style.qtyBtn}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={style.formGroup} style={{ marginTop: "15px" }}>
                <label>Reason for Refund</label>
                <Input
                  value={refundReason}
                  onChange={(e: any) => setRefundReason(e.target.value)}
                  placeholder="e.g. Broken packaging, Customer mind change"
                  width="100%"
                />
              </div>

              <div className={style.modalActions}>
                <Button
                  onClick={handleProcessRefund}
                  variant="error"
                  disabled={refundSubmitting}
                  fullWidth
                >
                  {refundSubmitting ? "Processing Refund..." : "Execute Refund"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
