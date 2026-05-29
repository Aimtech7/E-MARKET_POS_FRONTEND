import React, { FC, useState, useRef, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useReactToPrint } from "react-to-print";
import axios from "axios";
import useTheme from "../../context/Theme/useTheme";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import Button from "../Button";
import Input from "../Input";
import { PrintableInvoice } from "../PrintableInvoice";
import style from "./style.module.css";

interface ReceiptModalProps {
  cart: Cart;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ReceiptModal: FC<ReceiptModalProps> = ({ cart, isOpen, onClose, onSuccess }) => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const snackbar = useSnackbar();

  const [step, setStep] = useState<"payment" | "receipt">("payment");
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [changeGiven, setChangeGiven] = useState<number>(0);
  const amountPaid = cashAmount + cardAmount;
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);

  const printComponentRef = useRef<HTMLDivElement>(null);

  // Calculate cart total
  const items = cart.products || [];
  let subtotal = 0;
  items.forEach((p) => {
    subtotal += p.qty * p.price;
  });
  const discountAmount = subtotal * cart.discount;
  const taxAmount = (subtotal - discountAmount) * cart.tax;
  const finalTotal = subtotal - discountAmount + taxAmount;

  useEffect(() => {
    // Set default amount paid to final total on open
    if (isOpen) {
      setCashAmount(parseFloat(finalTotal.toFixed(2)));
      setCardAmount(0);
      setStep("payment");
      setInvoice(null);
      // Fetch Store Settings for logo/header
      axios.get("http://localhost:5500/settings", { headers: { Authorization: "barear " + cookies.auth?.token } })
        .then(res => setStoreSettings(res.data))
        .catch(console.error);
    }
  }, [isOpen, finalTotal, cookies.auth?.token]);

  useEffect(() => {
    const change = amountPaid - finalTotal;
    setChangeGiven(change > 0 ? parseFloat(change.toFixed(2)) : 0);
  }, [amountPaid, finalTotal]);

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
  });

  const handleCompletePayment = async () => {
    if (amountPaid < finalTotal) {
      snackbar.onResponse({
        message: "Paid amount must be at least the total order amount.",
        status: 400,
      });
      return;
    }

    setSubmitting(true);
    const token = cookies.auth?.token;

    try {
      // 1. Check out/Save active Cart in database
      const cartResponse = await axios.post(
        "http://localhost:5500/cart/check",
        {
          description: cart.description || "Checkout order",
          tax: cart.tax,
          discount: cart.discount,
          products: cart.products.map((p) => ({ product: p.id, qty: p.qty })),
        },
        {
          headers: { Authorization: "barear " + token },
        }
      );

      // Find the created cart from backend.
      // Wait, let's see: the backend checkCart saves the cart in the database, but let's check what it returns.
      // In cart-controller.js line 44, it returns:
      // res.status(201).json({ message: "Cart have been added into database" });
      // Wait! It does not return the cart ID or object itself in JSON! It only returns the message!
      // Wait, let's look at `controller/cart-controller.js`:
      // Ah! `cart = new Cart({...}); cart.save(); ... return res.status(201).json({ message: "Cart have been added into database" });`
      // Wait, if it doesn't return the cart object, how do we get the cart ID to link to the invoice?
      // Let's modify the backend `controller/cart-controller.js` to return the saved `cart` object!
      // This is extremely important, because without the cart ID, we can't create the Invoice!
      // Let's make sure we update the backend cart-controller checkCart to return the saved cart object (including its generated ID).
      // Let's check `controller/cart-controller.js` line 44:
      // Yes! We will replace it to return the saved cart object as well. We'll do that right after creating this frontend component.
      
      // Let's proceed with the frontend request assuming it returns { message: "...", cart: { _id: "..." } }
      // Wait, what if we get all carts and find the latest? Returning it in the response is much more robust!
      // Let's implement that backend tweak.
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCheckoutProcess = async () => {
    if (amountPaid < finalTotal && !cart.customerId) {
      snackbar.onResponse({
        message: "Amount paid cannot be less than total unless a Customer is attached for credit sale.",
        status: 400,
      });
      return;
    }

    setSubmitting(true);
    const token = cookies.auth?.token;

    try {
      // 1. Get or Create Cart in Database
      const resCart = await axios.post(
        "http://localhost:5500/cart/check", 
        {
          description: cart.description || "POS Supermarket Sale",
          tax: cart.tax,
          discount: cart.discount,
          products: cart.products.map((p) => ({ product: p.id, qty: p.qty })),
        },
        {
          headers: { Authorization: "barear " + token },
        }
      );

      const dbCartId = resCart.data.cart._id;

      // 2. Create the Invoice
      const resInvoice = await axios.post(
        "http://localhost:5500/invoice",
        {
          cartId: dbCartId,
          amountPaid,
          changeGiven,
          payments: [
            { method: "Cash", amount: cashAmount },
            { method: "Card", amount: cardAmount }
          ].filter(p => p.amount > 0),
          customerId: cart.customerId,
        },
        {
          headers: { Authorization: "barear " + token },
        }
      );

      // 3. Create the Receipt
      const resReceipt = await axios.post(
        "http://localhost:5500/receipt",
        {
          invoiceId: resInvoice.data.invoice._id,
          customer: cart.customerId ? cart.customerName : "Walk-in",
        },
        {
          headers: { Authorization: "barear " + token },
        }
      );

      // 4. Create Debt if Credit Sale
      if (amountPaid < finalTotal && cart.customerId) {
        await axios.post(
          "http://localhost:5500/debts",
          {
            customerId: cart.customerId,
            saleId: resReceipt.data.receipt._id,
            amount: finalTotal,
            paid: amountPaid,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
          },
          { headers: { Authorization: "barear " + token } }
        );
      }

      // Successfully processed invoice
      snackbar.onResponse({
        message: "Transaction and Receipt completed successfully.",
        status: 201,
      });

      setReceipt(resReceipt.data.receipt);
      setInvoice(resInvoice.data.invoice);
      setStep("receipt");
    } catch (err: any) {
      snackbar.onResponse({
        message: err.response?.data?.message || "Failed to process checkout transaction.",
        status: err.response?.status || 500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  const handleDownloadPDF = () => {
    if (receipt && receipt.receiptNumber) {
      window.open(`http://localhost:5500/uploads/receipts/${receipt.receiptNumber}.pdf`, "_blank");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={style.overlay}>
      <div className={style.modal} style={{ backgroundColor: theme.palette.paper, color: theme.palette.textPrimary }}>
        <div className={style.header}>
          <h2>{step === "payment" ? "Complete Payment" : "Transaction Receipt"}</h2>
          {step === "payment" && <button className={style.closeBtn} onClick={onClose}>&times;</button>}
        </div>

        {step === "payment" ? (
          <div className={style.body}>
            <div className={style.summaryCard} style={{ backgroundColor: theme.palette.secondary + "22" }}>
              <div className={style.summaryRow}>
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className={style.summaryRow}>
                <span>Discount ({(cart.discount * 100).toFixed(0)}%):</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
              <div className={style.summaryRow}>
                <span>Tax ({(cart.tax * 100).toFixed(0)}%):</span>
                <span>+${taxAmount.toFixed(2)}</span>
              </div>
              <div className={`${style.summaryRow} ${style.totalRow}`}>
                <span>Total Amount Due:</span>
                <span className={style.totalPrice}>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className={style.form}>
              <div className={style.formGroup}>
                <label>Cash Amount ($)</label>
                <Input
                  type="number"
                  value={cashAmount}
                  onChange={(e: any) => setCashAmount(parseFloat(e.target.value) || 0)}
                  width="100%"
                />
              </div>

              <div className={style.formGroup}>
                <label>Card Amount ($)</label>
                <Input
                  type="number"
                  value={cardAmount}
                  onChange={(e: any) => setCardAmount(parseFloat(e.target.value) || 0)}
                  width="100%"
                />
              </div>

              <div className={style.changeDisplay}>
                <span>Change Given:</span>
                <span className={style.changeValue}>${changeGiven.toFixed(2)}</span>
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={handleCheckoutProcess}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Complete Checkout"}
              </Button>
            </div>
          </div>
        ) : (
          <div className={style.body}>
            <div className={style.previewContainer} style={{ background: "#f0f0f0", padding: "20px", display: "flex", justifyContent: "center" }}>
              {receipt && (
                <div style={{ background: "white", padding: "15px", width: "300px", color: "black", fontFamily: "monospace", fontSize: "12px" }} ref={printComponentRef}>
                  <div style={{ textAlign: "center" }}>
                    {storeSettings?.logo && (
                      <img src={`http://localhost:5500/${storeSettings.logo}`} alt="Store Logo" style={{ width: "80px", marginBottom: "5px" }} />
                    )}
                    <h3 style={{ margin: "0 0 5px 0" }}>{storeSettings?.shopName || "EMMARKET SUPERMARKET"}</h3>
                    <p style={{ margin: "2px 0" }}>123 Market Street, Cityville</p>
                    <p style={{ margin: "2px 0" }}>Tel: +123-456-7890</p>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <p style={{ margin: "2px 0" }}>Receipt #: {receipt.receiptNumber}</p>
                    <p style={{ margin: "2px 0" }}>Date: {new Date(receipt.timestamp).toLocaleString()}</p>
                    <p style={{ margin: "2px 0" }}>Cashier: {receipt.cashier}</p>
                    <p style={{ margin: "2px 0" }}>Customer: {cart.customerId ? cart.customerName : "Walk-in"}</p>
                  </div>
                  <div style={{ margin: "5px 0" }}>------------------------------------------</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                          <td style={{ textAlign: "right" }}>${(item.qty * item.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ margin: "5px 0" }}>------------------------------------------</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Subtotal:</span>
                    <span>${receipt.subtotal.toFixed(2)}</span>
                  </div>
                  {receipt.tax > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Tax:</span>
                      <span>+${receipt.tax.toFixed(2)}</span>
                    </div>
                  )}
                  {receipt.discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Discount:</span>
                      <span>-${receipt.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: "5px" }}>
                    <span>TOTAL:</span>
                    <span>${receipt.grandTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
                    <span>Paid ({receipt.paymentMethod}):</span>
                    <span>${receipt.amountPaid.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Change:</span>
                    <span>${receipt.changeGiven.toFixed(2)}</span>
                  </div>
                  <div style={{ textAlign: "center", marginTop: "10px", fontSize: "11px" }}>
                    <p style={{ margin: "2px 0" }}>Thank you for shopping with us!</p>
                  </div>
                </div>
              )}
            </div>

            <div className={style.actions}>
              <Button onClick={handlePrint} variant="primary" className={style.actionBtn}>
                Print Receipt
              </Button>
              <Button onClick={handleDownloadPDF} variant="secondary" className={style.actionBtn}>
                Download PDF
              </Button>
              <Button onClick={handleFinish} variant="warning" className={style.actionBtn}>
                Finish & Clear Cart
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptModal;
