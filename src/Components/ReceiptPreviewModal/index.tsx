import React, { FC, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import style from "./style.module.css";
import useTheme from "../../context/Theme/useTheme";

interface ReceiptPreviewModalProps {
  receipt: any;
  onClose: () => void;
}

const ReceiptPreviewModal: FC<ReceiptPreviewModalProps> = ({ receipt, onClose }) => {
  const theme = useTheme();
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Receipt-${receipt?.receiptNumber}`,
    onAfterPrint: () => onClose(),
  });

  if (!receipt) return null;

  return (
    <div className={style.overlay}>
      <div className={style.modal} style={{ backgroundColor: theme.palette.paper, color: theme.palette.textPrimary }}>
        <div className={style.header}>
          <h2>Receipt Generated</h2>
          <button className={style.closeBtn} onClick={onClose} style={{ color: theme.palette.textSecondary }}>
            &times;
          </button>
        </div>
        
        <div className={style.previewContainer}>
          {/* Printable Area - styled for 80mm thermal printers */}
          <div className={style.receiptWrapper}>
            <div className={style.printableReceipt} ref={componentRef}>
              <div className={style.receiptHeader}>
                <h3 className={style.shopName}>EMMARKET SUPERMARKET</h3>
                <p>123 Market Street, Cityville</p>
                <p>Tel: +123-456-7890</p>
              </div>

              <div className={style.receiptMeta}>
                <p>Receipt #: {receipt.receiptNumber}</p>
                <p>Date: {new Date(receipt.timestamp).toLocaleString()}</p>
                <p>Cashier: {receipt.cashier}</p>
                <p>Customer: {receipt.customer}</p>
              </div>

              <div className={style.divider}>------------------------------------------</div>

              <table className={style.itemsTable}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Item</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ textAlign: "left" }}>{item.productName.substring(0, 15)}</td>
                      <td style={{ textAlign: "center" }}>{item.qty}</td>
                      <td style={{ textAlign: "right" }}>Ksh {(item.qty * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={style.divider}>------------------------------------------</div>

              <div className={style.totals}>
                <div className={style.row}>
                  <span>Subtotal:</span>
                  <span>Ksh {receipt.subtotal.toFixed(2)}</span>
                </div>
                {receipt.discount > 0 && (
                  <div className={style.row}>
                    <span>Discount:</span>
                    <span>-Ksh {receipt.discount.toFixed(2)}</span>
                  </div>
                )}
                {receipt.tax > 0 && (
                  <div className={style.row}>
                    <span>Tax:</span>
                    <span>+Ksh {receipt.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className={`${style.row} ${style.grandTotal}`}>
                  <span>TOTAL:</span>
                  <span>Ksh {receipt.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className={style.paymentInfo}>
                <div className={style.row}>
                  <span>Paid ({receipt.paymentMethod}):</span>
                  <span>Ksh {receipt.amountPaid.toFixed(2)}</span>
                </div>
                <div className={style.row}>
                  <span>Change:</span>
                  <span>Ksh {receipt.changeGiven.toFixed(2)}</span>
                </div>
              </div>

              <div className={style.footer}>
                <p>Thank you for shopping with us!</p>
                <p>Please retain this receipt.</p>
              </div>
            </div>
          </div>
        </div>

        <div className={style.actions}>
          <button className={style.cancelBtn} onClick={onClose} style={{ borderColor: theme.palette.secondary, color: theme.palette.textPrimary }}>
            Close
          </button>
          <button className={style.printBtn} onClick={() => handlePrint()} style={{ backgroundColor: theme.palette.primary, color: 'white' }}>
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewModal;
