import React, { FC, useState, useEffect, useRef } from "react";
import { useCookies } from "react-cookie";
import { useReactToPrint } from "react-to-print";
import axios from "axios";
import useTheme from "../../context/Theme/useTheme";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import Button from "../Button";
import { PrintableInvoice } from "../PrintableInvoice";
import style from "./style.module.css";

interface ReceiptHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReceiptHistoryModal: FC<ReceiptHistoryModalProps> = ({ isOpen, onClose }) => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const snackbar = useSnackbar();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const printComponentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
  });

  const fetchInvoices = async () => {
    setLoading(true);
    const token = cookies.auth?.token;
    try {
      const res = await axios.get("http://localhost:5500/invoice", {
        headers: { Authorization: "barear " + token },
      });
      setInvoices(res.data);
    } catch (err: any) {
      snackbar.onResponse({
        message: err.response?.data?.message || "Failed to fetch invoice history.",
        status: err.response?.status || 500,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInvoices();
    }
  }, [isOpen]);

  const handleTriggerReprint = (inv: Invoice) => {
    setSelectedInvoice(inv);
    // Use timeout to allow state update to render PrintableInvoice ref, then trigger print
    setTimeout(() => {
      handlePrint();
    }, 150);
  };

  const handleDownloadPDF = (inv: Invoice) => {
    window.open(`http://localhost:5500/uploads/invoices/${inv.invoiceNumber}.pdf`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className={style.overlay}>
      <div className={style.modal} style={{ backgroundColor: theme.palette.paper, color: theme.palette.textPrimary }}>
        <div className={style.header}>
          <h2>Receipt & Invoice History</h2>
          <button className={style.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={style.body}>
          {loading ? (
            <p className={style.loading}>Loading transactions history...</p>
          ) : invoices.length === 0 ? (
            <p className={style.empty}>No past receipts or invoices found.</p>
          ) : (
            <div className={style.tableContainer}>
              <table className={style.table}>
                <thead>
                  <tr style={{ color: theme.palette.textSecondary }}>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Cashier</th>
                    <th>Total</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const cart = inv.cart || { products: [], tax: 0, discount: 0 };
                    const subtotal = (cart.products || []).reduce((acc, p) => acc + p.qty * p.price, 0);
                    const discountAmount = subtotal * (cart.discount || 0);
                    const taxAmount = (subtotal - discountAmount) * (cart.tax || 0);
                    const finalTotal = subtotal - discountAmount + taxAmount;

                    return (
                      <tr key={inv._id} style={{ borderBottom: `1px solid ${theme.palette.secondary}22` }}>
                        <td className={style.bold}>{inv.invoiceNumber}</td>
                        <td>{new Date(inv.timestamp).toLocaleDateString()}</td>
                        <td>{inv.cashier}</td>
                        <td className={style.price}>${finalTotal.toFixed(2)}</td>
                        <td>
                          <div className={style.actions}>
                            <button
                              onClick={() => handleTriggerReprint(inv)}
                              className={`${style.actionBtn} ${style.printBtn}`}
                              style={{ backgroundColor: theme.palette.primary }}
                            >
                              Reprint
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(inv)}
                              className={`${style.actionBtn} ${style.pdfBtn}`}
                              style={{ backgroundColor: theme.palette.secondary }}
                            >
                              PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hidden Area to mount selected invoice for react-to-print */}
        <div style={{ display: "none" }}>
          {selectedInvoice && (
            <PrintableInvoice ref={printComponentRef} invoice={selectedInvoice} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptHistoryModal;
