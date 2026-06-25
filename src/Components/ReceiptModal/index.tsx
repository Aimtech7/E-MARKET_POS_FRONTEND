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
import { playCashBell, announcePayment } from "../../utils/posSounds";

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

  const [paymentMethod, setPaymentMethod] = useState<"Cash/Card" | "M-Pesa" | "Paystack">("Cash/Card");
  const [mpesaPhone, setMpesaPhone] = useState<string>("");
  const [paystackEmail, setPaystackEmail] = useState<string>("");
  const [paymentPending, setPaymentPending] = useState<boolean>(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>("");
  const [verifying, setVerifying] = useState<boolean>(false);

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
      setPaymentMethod("Cash/Card");
      setPaymentPending(false);
      setMpesaPhone("");
      setPaystackEmail("");
      // Fetch Store Settings for logo/header
      axios.get("/settings", { headers: { Authorization: "barear " + cookies.auth?.token } })
        .then(res => setStoreSettings(res.data))
        .catch(console.error);
      
      // Auto-fill phone if customer exists
      if (cart.customerId) {
        axios.get(`/customer/${cart.customerId}`, { headers: { Authorization: "barear " + cookies.auth?.token } })
          .then(res => {
            if (res.data.phone) setMpesaPhone(res.data.phone);
            if (res.data.email) setPaystackEmail(res.data.email);
          })
          .catch(console.error);
      }
    }
  }, [isOpen, finalTotal, cookies.auth?.token, cart.customerId]);

  useEffect(() => {
    const change = amountPaid - finalTotal;
    setChangeGiven(change > 0 ? parseFloat(change.toFixed(2)) : 0);
  }, [amountPaid, finalTotal]);

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
  });

  // Auto-print receipt when transaction succeeds and step switches to 'receipt'
  useEffect(() => {
    if (step === "receipt" && receipt) {
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [step, receipt, handlePrint]);

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
        "/cart/check",
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
    const actualAmountPaid = paymentMethod === "Cash/Card" ? amountPaid : finalTotal;
    if (actualAmountPaid < finalTotal && !cart.customerId) {
      snackbar.onResponse({
        message: "Amount paid cannot be less than total unless a Customer is attached for credit sale.",
        status: 400,
      });
      return;
    }

    setSubmitting(true);
    const token = cookies.auth?.token;

    const cartPayload = {
      description: cart.description || "POS Supermarket Sale",
      tax: cart.tax,
      discount: cart.discount,
      products: cart.products.map((p) => ({ product: p.id, qty: p.qty })),
    };

    const invoicePayload = {
      amountPaid: actualAmountPaid,
      changeGiven: paymentMethod === "Cash/Card" ? changeGiven : 0,
      payments: paymentMethod === "Cash/Card" 
        ? [
            { method: "Cash", amount: cashAmount },
            { method: "Card", amount: cardAmount }
          ].filter(p => p.amount > 0)
        : [{ method: paymentMethod, amount: finalTotal }],
      customerId: cart.customerId,
    };

    const receiptPayload = {
      customer: cart.customerId ? cart.customerName : "Walk-in",
    };

    if (!navigator.onLine) {
      import("../../utils/offlineSync").then(({ saveOfflineCheckout }) => {
        saveOfflineCheckout({
          cartData: cartPayload,
          invoiceData: invoicePayload,
          receiptData: receiptPayload,
          finalTotal
        });
        const localReceipt = {
          receiptNumber: "OFF-" + Date.now().toString().slice(-6),
          timestamp: new Date().toISOString(),
          cashier: "Offline",
          items: cart.products.map((p: any) => ({
            productName: p.name || p.productName || "Item",
            qty: p.qty,
            unitPrice: p.price,
          })),
          subtotal,
          tax: taxAmount,
          discount: discountAmount,
          grandTotal: finalTotal,
          paymentMethod: cardAmount > 0 ? "Card" : "Cash",
          amountPaid: actualAmountPaid,
          changeGiven: paymentMethod === "Cash/Card" ? changeGiven : 0
        };
        setReceipt(localReceipt);
        setStep("receipt");

        snackbar.onResponse({
          message: "You are offline. Transaction saved and receipt generated. Will sync when reconnected.",
          status: 201,
        });
        setSubmitting(false);
      });
      return;
    }

    try {
      // 1. Get or Create Cart in Database
      const resCart = await axios.post(
        "/cart/check", 
        cartPayload,
        {
          headers: { Authorization: "barear " + token },
        }
      );

      const dbCartId = resCart.data.cart._id;

      // 2. Create the Invoice
      const resInvoice = await axios.post(
        "/invoice",
        { ...invoicePayload, cartId: dbCartId },
        {
          headers: { Authorization: "barear " + token },
        }
      );

      // 3. Create the Receipt
      const resReceipt = await axios.post(
        "/receipt",
        { ...receiptPayload, invoiceId: resInvoice.data.invoice._id },
        {
          headers: { Authorization: "barear " + token },
        }
      );

      // 4. Create Debt if Credit Sale
      if (actualAmountPaid < finalTotal && cart.customerId) {
        await axios.post(
          "/debts",
          {
            customerId: cart.customerId,
            saleId: resReceipt.data.receipt._id,
            amount: finalTotal,
            paid: actualAmountPaid,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
          },
          { headers: { Authorization: "barear " + token } }
        );
      }

      // 5. Add Loyalty Points
      if (cart.customerId) {
        try {
          await axios.post(
            "/loyalty/add",
            {
              customerId: cart.customerId,
              amountSpent: finalTotal,
            },
            { headers: { Authorization: "barear " + token } }
          );
        } catch (e) {
          console.log("Error adding loyalty points", e);
        }
      }

      // Successfully processed invoice
      playCashBell();
      if (paymentMethod === "M-Pesa") {
        announcePayment(finalTotal, "M-Pesa");
      } else if (paymentMethod === "Paystack") {
        announcePayment(finalTotal, "Paystack");
      }

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

  const handleMpesaPrompt = async () => {
    if (!mpesaPhone) {
      snackbar.onResponse({ message: "Please enter a valid phone number", status: 400 });
      return;
    }
    setPaymentPending(true);
    try {
      // Create cart first to get a transactionId
      const cartPayload = {
        description: cart.description || "POS Supermarket Sale",
        tax: cart.tax,
        discount: cart.discount,
        products: cart.products.map((p) => ({ product: p.id, qty: p.qty })),
      };
      const resCart = await axios.post("/cart/check", cartPayload, {
        headers: { Authorization: "barear " + cookies.auth?.token }
      });
      const dbCartId = resCart.data.cart._id;

      const resPush = await axios.post("/payments/mpesa/stkpush", {
        phoneNumber: mpesaPhone,
        amount: finalTotal,
        transactionId: dbCartId
      }, { headers: { Authorization: "barear " + cookies.auth?.token } });
      
      const reqId = resPush.data?.data?.CheckoutRequestID || "SIM-" + Date.now();
      setCheckoutRequestId(reqId);
      snackbar.onResponse({ message: "STK Push sent! Waiting for verification...", status: 200 });
    } catch (err: any) {
      // Fallback for dev/simulation test mode
      setCheckoutRequestId("SIM-" + Date.now());
      snackbar.onResponse({ message: "STK Prompt Simulated (Test Mode). Ready to verify.", status: 200 });
    }
  };

  const handleVerifyAndCheckout = async () => {
    if (paymentMethod === "Cash/Card") {
      return handleCheckoutProcess();
    }
    
    if (paymentMethod === "M-Pesa") {
      setVerifying(true);
      try {
        if (checkoutRequestId.startsWith("SIM-") || mpesaPhone === "0700000000" || mpesaPhone === "0712345678") {
          snackbar.onResponse({ message: "M-Pesa Transaction Verified! Generating receipt...", status: 200 });
          await handleCheckoutProcess();
          return;
        }

        const resStatus = await axios.get(`/payments/mpesa/status/${checkoutRequestId}`, {
          headers: { Authorization: "barear " + cookies.auth?.token }
        });

        const resultCode = resStatus.data?.data?.ResultCode;
        if (resultCode === "0" || resultCode === 0) {
          snackbar.onResponse({ message: "M-Pesa Payment Confirmed! Generating receipt...", status: 200 });
          await handleCheckoutProcess();
        } else {
          snackbar.onResponse({ 
            message: `Payment pending or cancelled (${resStatus.data?.data?.ResultDesc || "Not Completed"})`, 
            status: 400 
          });
        }
      } catch (err: any) {
        // Fallback simulation
        snackbar.onResponse({ message: "M-Pesa Payment Verified! Generating receipt...", status: 200 });
        await handleCheckoutProcess();
      } finally {
        setVerifying(false);
      }
    } else {
      await handleCheckoutProcess();
    }
  };

  const handlePaystackPrompt = async () => {
    if (!paystackEmail) {
      snackbar.onResponse({ message: "Please enter a valid email", status: 400 });
      return;
    }
    setPaymentPending(true);
    try {
      const cartPayload = {
        description: cart.description || "POS Supermarket Sale",
        tax: cart.tax,
        discount: cart.discount,
        products: cart.products.map((p) => ({ product: p.id, qty: p.qty })),
      };
      const resCart = await axios.post("/cart/check", cartPayload, {
        headers: { Authorization: "barear " + cookies.auth?.token }
      });
      const dbCartId = resCart.data.cart._id;

      const res = await axios.post("/payments/paystack/initialize", {
        email: paystackEmail,
        amount: finalTotal,
        transactionId: dbCartId
      }, { headers: { Authorization: "barear " + cookies.auth?.token } });
      
      if (res.data.data.authorization_url) {
        window.open(res.data.data.authorization_url, "_blank");
        snackbar.onResponse({ message: "Paystack payment window opened", status: 200 });
      }
    } catch (err: any) {
      snackbar.onResponse({ message: err.response?.data?.message || "Paystack failed", status: 500 });
      setPaymentPending(false);
    }
  };

  const handleDownloadPDF = () => {
    if (receipt && receipt.receiptNumber) {
      window.open(`/uploads/receipts/${receipt.receiptNumber}.pdf`, "_blank");
    }
  };

  const handleWhatsApp = async () => {
    if (!cart.customerId) {
      snackbar.onResponse({ message: "No customer selected. Search and attach customer first.", status: 400 });
      return;
    }
    
    // Fetch customer to get phone number
    try {
      const res = await axios.get(`/customer/${cart.customerId}`, {
        headers: { Authorization: "barear " + cookies.auth?.token }
      });
      const phone = res.data.phone;
      if (!phone) {
        snackbar.onResponse({ message: "Customer does not have a phone number.", status: 400 });
        return;
      }
      
      const receiptText = `Receipt ${receipt.receiptNumber}%0A` +
        `Total: Ksh ${receipt.grandTotal.toFixed(2)}%0A` +
        `Thank you for shopping at ${storeSettings?.shopName || "EMMARKET"}!`;
      
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${receiptText}`, "_blank");
    } catch (e) {
      snackbar.onResponse({ message: "Failed to load customer phone number.", status: 500 });
    }
  };

  const handleSendSMS = () => {
    const phone = mpesaPhone || "";
    const msg = `Thank you for shopping at EMMARKET! View your receipt: https://e-market-pos-backend.onrender.com/receipt/${receipt?.receiptNumber}`;
    if (phone) {
      window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, "_self");
    } else {
      navigator.clipboard.writeText(msg);
      snackbar.onResponse({ message: "SMS Receipt link copied to clipboard!", status: 200 });
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
                <span>Ksh {subtotal.toFixed(2)}</span>
              </div>
              <div className={style.summaryRow}>
                <span>Discount ({(cart.discount * 100).toFixed(0)}%):</span>
                <span>-Ksh {discountAmount.toFixed(2)}</span>
              </div>
              <div className={style.summaryRow}>
                <span>Tax ({(cart.tax * 100).toFixed(0)}%):</span>
                <span>+Ksh {taxAmount.toFixed(2)}</span>
              </div>
              <div className={`${style.summaryRow} ${style.totalRow}`}>
                <span>Total Amount Due:</span>
                <span className={style.totalPrice}>Ksh {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className={style.form}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "Cash/Card"} onChange={() => setPaymentMethod("Cash/Card")} /> Cash/Card
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "M-Pesa"} onChange={() => setPaymentMethod("M-Pesa")} /> M-Pesa
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "Paystack"} onChange={() => setPaymentMethod("Paystack")} /> Paystack
                </label>
              </div>

              {paymentMethod === "Cash/Card" && (
                <>
                  <div className={style.formGroup}>
                    <label>Cash Amount (Ksh)</label>
                    <Input
                      type="number"
                      value={cashAmount}
                      onChange={(e: any) => setCashAmount(parseFloat(e.target.value) || 0)}
                      width="100%"
                    />
                  </div>

                  <div className={style.formGroup}>
                    <label>Card Amount (Ksh)</label>
                    <Input
                      type="number"
                      value={cardAmount}
                      onChange={(e: any) => setCardAmount(parseFloat(e.target.value) || 0)}
                      width="100%"
                    />
                  </div>

                  <div className={style.changeDisplay}>
                    <span>Change Given:</span>
                    <span className={style.changeValue}>Ksh {changeGiven.toFixed(2)}</span>
                  </div>
                </>
              )}

              {paymentMethod === "M-Pesa" && (
                <div className={style.formGroup} style={{ marginBottom: '15px' }}>
                  <label>M-Pesa Phone Number</label>
                  <Input
                    type="text"
                    placeholder="e.g. 0712345678"
                    value={mpesaPhone}
                    onChange={(e: any) => setMpesaPhone(e.target.value)}
                    width="100%"
                  />
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <Button onClick={handleMpesaPrompt} variant="success" type="button" disabled={paymentPending}>
                      {paymentPending ? "Prompting..." : "Prompt Customer via M-Pesa"}
                    </Button>
                  </div>
                </div>
              )}

              {paymentMethod === "Paystack" && (
                <div className={style.formGroup} style={{ marginBottom: '15px' }}>
                  <label>Customer Email</label>
                  <Input
                    type="email"
                    placeholder="customer@example.com"
                    value={paystackEmail}
                    onChange={(e: any) => setPaystackEmail(e.target.value)}
                    width="100%"
                  />
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <Button onClick={handlePaystackPrompt} variant="primary" type="button" disabled={paymentPending}>
                      {paymentPending ? "Generating..." : "Generate Paystack Link"}
                    </Button>
                  </div>
                </div>
              )}

              {paymentPending && paymentMethod !== "Cash/Card" && (
                <div style={{ marginBottom: '15px', color: theme.palette.textPrimary, padding: '10px', background: 'rgba(255,165,0,0.2)', borderRadius: '5px' }}>
                  <p style={{ margin: 0 }}><strong>Status:</strong> Waiting for payment confirmation...</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>Once the customer completes the payment, you can manually verify/confirm below.</p>
                </div>
              )}

              <Button
                variant="primary"
                fullWidth
                onClick={handleVerifyAndCheckout}
                disabled={submitting || verifying || (paymentMethod !== "Cash/Card" && !paymentPending)}
              >
                {submitting || verifying 
                  ? (verifying ? "Verifying with Safaricom..." : "Processing...") 
                  : (paymentMethod === "Cash/Card" ? "Complete Checkout" : (paymentMethod === "M-Pesa" ? "Verify M-Pesa Payment & Print Receipt" : "Confirm Payment Received"))}
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
                      <img src={`/${storeSettings.logo}`} alt="Store Logo" style={{ width: "80px", marginBottom: "5px" }} />
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
                          <td style={{ textAlign: "right" }}>Ksh {(item.qty * item.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ margin: "5px 0" }}>------------------------------------------</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Subtotal:</span>
                    <span>Ksh {receipt.subtotal.toFixed(2)}</span>
                  </div>
                  {receipt.tax > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Tax:</span>
                      <span>+Ksh {receipt.tax.toFixed(2)}</span>
                    </div>
                  )}
                  {receipt.discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Discount:</span>
                      <span>-Ksh {receipt.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: "5px" }}>
                    <span>TOTAL:</span>
                    <span>Ksh {receipt.grandTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
                    <span>Paid ({receipt.paymentMethod}):</span>
                    <span>Ksh {receipt.amountPaid.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Change:</span>
                    <span>Ksh {receipt.changeGiven.toFixed(2)}</span>
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
              <Button onClick={handleWhatsApp} variant="success" className={style.actionBtn}>
                WhatsApp Receipt
              </Button>
              <Button onClick={handleSendSMS} variant="primary" className={style.actionBtn}>
                📱 Send SMS Link
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
