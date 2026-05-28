import React, { FC, useState, useEffect } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/Reducers";
import { addProductToCart } from "../../store/Actions";
import useTheme from "../../context/Theme/useTheme";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import Button from "../Button";
import style from "./style.module.css";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

const BarcodeScanner: FC<BarcodeScannerProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const snackbar = useSnackbar();

  const cartId = useSelector<RootState>((state) => state.selectedCartReducer) as string;
  const products = useSelector<RootState>((state) => state.productsReducer) as Product[];

  const [lastScannedCode, setLastScannedCode] = useState<string>("");
  const [scanHistory, setScanHistory] = useState<{ title: string; barcode: string; time: string }[]>([]);
  const [keepOpen, setKeepOpen] = useState<boolean>(true);
  const [cooldown, setCooldown] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setLastScannedCode("");
      setScanHistory([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScan = (code: string) => {
    if (cooldown) return;

    // Prevent duplicate scans instantly
    setCooldown(true);
    setTimeout(() => setCooldown(false), 2000); // 2 second throttle/cooldown

    setLastScannedCode(code);

    // Look up the product in the local Redux store
    const foundProduct = products.find((p) => p.barcode === code || p.sku === code);

    if (foundProduct) {
      dispatch(addProductToCart(cartId, foundProduct));
      
      const newScan = {
        title: foundProduct.title,
        barcode: code,
        time: new Date().toLocaleTimeString(),
      };
      setScanHistory((prev) => [newScan, ...prev]);

      snackbar.onResponse({
        message: `Successfully added ${foundProduct.title} to cart.`,
        status: 200,
      });

      if (!keepOpen) {
        onClose();
      }
    } else {
      snackbar.onResponse({
        message: `Product with barcode/SKU "${code}" not found.`,
        status: 404,
      });
    }
  };

  return (
    <div className={style.overlay}>
      <div
        className={style.modal}
        style={{
          backgroundColor: theme.palette.paper,
          color: theme.palette.textPrimary,
        }}
      >
        <div className={style.header}>
          <h2>Barcode / SKU Camera Scanner</h2>
          <button className={style.closeBtn} onClick={onClose} style={{ color: theme.palette.textSecondary }}>
            &times;
          </button>
        </div>

        <div className={style.body}>
          <div className={style.scannerContainer}>
            <div className={style.cameraFrame} style={{ borderColor: theme.palette.primary }}>
              <BarcodeScannerComponent
                width="100%"
                height="100%"
                onUpdate={(err, result) => {
                  if (result) {
                    handleScan(result.getText());
                  }
                }}
              />
              <div className={style.laserLine}></div>
            </div>
            <p className={style.instruction}>Align barcode inside the camera window</p>
          </div>

          <div className={style.sidebar}>
            <div className={style.controlGroup}>
              <label className={style.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={keepOpen}
                  onChange={(e) => setKeepOpen(e.target.checked)}
                  style={{ accentColor: theme.palette.primary }}
                />
                Keep scanner open for multiple items
              </label>
            </div>

            <div className={style.statusContainer}>
              <h4>Last Scanned Code:</h4>
              <p
                className={style.scannedCode}
                style={{
                  backgroundColor: theme.palette.secondary + "22",
                  color: theme.palette.primary,
                }}
              >
                {lastScannedCode || "No scans yet"}
              </p>
              {cooldown && <p className={style.cooldownText}>Processing scan...</p>}
            </div>

            <div className={style.historySection}>
              <h4>Scan History (Session):</h4>
              <div className={style.historyList}>
                {scanHistory.length === 0 ? (
                  <p className={style.emptyHistory}>Scanned products will appear here.</p>
                ) : (
                  scanHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={style.historyItem}
                      style={{ borderBottom: `1px solid ${theme.palette.secondary}11` }}
                    >
                      <span className={style.itemTitle}>{item.title}</span>
                      <span className={style.itemMeta}>
                        {item.barcode} • {item.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={style.footer}>
          <Button variant="secondary" onClick={onClose}>
            Close Scanner
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
