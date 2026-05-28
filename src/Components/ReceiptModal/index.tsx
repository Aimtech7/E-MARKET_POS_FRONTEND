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
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [changeGiven, setChangeGiven] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

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
      setAmountPaid(parseFloat(finalTotal.toFixed(2)));
      setStep("payment");
      setInvoice(null);
    }
  }, [isOpen, finalTotal]);

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
    if (amountPaid < finalTotal) {
      snackbar.onResponse({
        message: "Amount paid cannot be less than the total amount.",
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
          paymentMethod,
        },
        {
          headers: { Authorization: "barear " + token },
        }
      );

      // Successfully processed invoice
      snackbar.onResponse({
        message: "Transaction completed successfully.",
        status: 201,
      });

      // Populate full invoice object with the cart products
      const populatedInvoice: Invoice = {
        ...resInvoice.data.invoice,
        cart: {
          ...cart,
          products: cart.products,
        },
      };

      setInvoice(populatedInvoice);
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
    if (invoice && invoice._id) {
      // Trigger dynamic browser download of generated PDF
      window.open(`http://localhost:5500/uploads/invoices/${invoice.invoiceNumber}.pdf`, "_blank");
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
                <label>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={style.select}
                  style={{
                    backgroundColor: theme.palette.paper,
                    color: theme.palette.textPrimary,
                    borderColor: theme.palette.secondary,
                  }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Mobile">Mobile Payment (M-Pesa/Wallet)</option>
                  <option value="Credit">Store Credit</option>
                </select>
              </div>

              <div className={style.formGroup}>
                <label>Amount Tendered ($)</label>
                <Input
                  type="number"
                  value={amountPaid}
                  onChange={(e: any) => setAmountPaid(parseFloat(e.target.value) || 0)}
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
            <div className={style.previewContainer}>
              {invoice && <PrintableInvoice ref={printComponentRef} invoice={invoice} />}
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
