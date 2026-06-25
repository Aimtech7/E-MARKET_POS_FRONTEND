import React, { FC, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import useTheme from "../../context/Theme/useTheme";
import Button from "../Button";

interface PrintBarcodeModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

const PrintBarcodeModal: FC<PrintBarcodeModalProps> = ({ product, isOpen, onClose }) => {
  const theme = useTheme();
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Barcode-${product?.productName}`,
  });

  if (!isOpen || !product) return null;

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
        display: "flex", justifyContent: "center", alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: theme.palette.paper, color: theme.palette.textPrimary,
          padding: "20px", borderRadius: "8px", width: "400px", maxWidth: "90%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Print Product Barcode</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: theme.palette.textSecondary }}>&times;</button>
        </div>
        
        <div style={{ display: "flex", justifyContent: "center", backgroundColor: "white", padding: "20px", borderRadius: "4px" }}>
          <div ref={componentRef} style={{ textAlign: "center", color: "black", backgroundColor: "white", padding: "10px" }}>
            <p style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold" }}>{product.productName}</p>
            <img 
              src={`/product/${product._id}/barcode`} 
              alt="Barcode" 
              style={{ width: "100%", maxHeight: "80px", objectFit: "contain" }} 
            />
            <p style={{ margin: "5px 0 0 0", fontSize: "12px" }}>Ksh {product.productPrice.toFixed(2)}</p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={handlePrint}>Print Barcode</Button>
        </div>
      </div>
    </div>
  );
};

export default PrintBarcodeModal;
