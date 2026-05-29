import React, { FC, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import ReceiptPreviewModal from "../ReceiptPreviewModal";
import Button from "../Button";

interface ReprintReceiptButtonProps {
  receiptId: string;
}

const ReprintReceiptButton: FC<ReprintReceiptButtonProps> = ({ receiptId }) => {
  const [cookies] = useCookies();
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const handleFetchAndPreview = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5500/receipt/${receiptId}`, {
        headers: { Authorization: "barear " + cookies.auth?.token },
      });
      setReceiptData(res.data);
    } catch (err) {
      console.error("Failed to fetch receipt", err);
      alert("Failed to load receipt details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        type="button" 
        onClick={handleFetchAndPreview} 
        disabled={loading}
      >
        {loading ? "Loading..." : "Reprint"}
      </Button>
      {receiptData && (
        <ReceiptPreviewModal 
          receipt={receiptData} 
          onClose={() => setReceiptData(null)} 
        />
      )}
    </>
  );
};

export default ReprintReceiptButton;
