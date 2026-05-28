import React, { forwardRef } from "react";
import style from "./style.module.css";

interface PrintableInvoiceProps {
  invoice: Invoice;
}

export const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ invoice }, ref) => {
    const cart = invoice.cart || { products: [], tax: 0, discount: 0 };
    const products = cart.products || [];

    // Calculate subtotal
    const subtotal = products.reduce((acc, p) => acc + p.qty * p.price, 0);
    const discountAmount = subtotal * (cart.discount || 0);
    const taxAmount = (subtotal - discountAmount) * (cart.tax || 0);
    const finalTotal = subtotal - discountAmount + taxAmount;

    return (
      <div ref={ref} className={style.ticket}>
        <div className={style.header}>
          <h1 className={style.title}>EMMARKET</h1>
          <p className={style.subtitle}>Supermarket POS Receipt</p>
          <p>123 Market Street, Cityville</p>
          <p>Tel: +123-456-7890</p>
        </div>

        <div className={style.separator}></div>

        <div className={style.info}>
          <p><strong>Invoice:</strong> {invoice.invoiceNumber}</p>
          <p><strong>Date:</strong> {new Date(invoice.timestamp).toLocaleString()}</p>
          <p><strong>Cashier:</strong> {invoice.cashier}</p>
          <p><strong>Payment:</strong> {invoice.paymentMethod}</p>
        </div>

        <div className={style.separator}></div>

        <table className={style.table}>
          <thead>
            <tr>
              <th className={style.leftAlign}>Item</th>
              <th className={style.centerAlign}>Qty</th>
              <th className={style.rightAlign}>Price</th>
              <th className={style.rightAlign}>Total</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className={style.leftAlign}>
                  {item.title}
                  <span className={style.unit}> ({item.unitOfMeasure.unitOfMeasureName})</span>
                </td>
                <td className={style.centerAlign}>{item.qty}</td>
                <td className={style.rightAlign}>${item.price.toFixed(2)}</td>
                <td className={style.rightAlign}>${(item.qty * item.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={style.separator}></div>

        <div className={style.totals}>
          <div className={style.row}>
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className={style.row}>
            <span>Discount ({(cart.discount * 100).toFixed(0)}%):</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
          <div className={style.row}>
            <span>Tax ({(cart.tax * 100).toFixed(0)}%):</span>
            <span>+${taxAmount.toFixed(2)}</span>
          </div>
          <div className={`${style.row} ${style.bold}`}>
            <span>Total:</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
          <div className={style.separator}></div>
          <div className={style.row}>
            <span>Paid:</span>
            <span>${invoice.amountPaid.toFixed(2)}</span>
          </div>
          <div className={style.row}>
            <span>Change:</span>
            <span>${invoice.changeGiven.toFixed(2)}</span>
          </div>
        </div>

        <div className={style.separator}></div>

        <div className={style.footer}>
          <p>Thank you for shopping with us!</p>
          <p>Please keep your receipt.</p>
        </div>
      </div>
    );
  }
);

PrintableInvoice.displayName = "PrintableInvoice";
