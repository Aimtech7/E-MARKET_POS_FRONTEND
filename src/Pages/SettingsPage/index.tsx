import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";
import Button from "../../Components/Button";
import Input from "../../Components/Input";
import useSnackbar from "../../context/Snackbar/useSnackbar";

const SettingsPage: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const snackbar = useSnackbar();
  
  const isAdmin = cookies.auth?.admin;

  const [shopName, setShopName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [taxRate, setTaxRate] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("");
  const [receiptFooter, setReceiptFooter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!isAdmin) return;
    
    setLoading(true);
    axios.get("http://localhost:5500/settings", {
      headers: { Authorization: "barear " + cookies.auth?.token }
    }).then(res => {
      const data = res.data;
      setShopName(data.shopName || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setTaxRate(data.taxRate || 0);
      setCurrency(data.currency || "$");
      setReceiptFooter(data.receiptFooter || "");
    }).catch(err => {
      console.error(err);
      snackbar.onResponse({ message: "Failed to load store settings.", status: 500 });
    }).finally(() => {
      setLoading(false);
    });
  }, [cookies.auth?.token, isAdmin, snackbar]);

  if (!isAdmin) {
    return (
      <div style={{ padding: "40px", color: theme.palette.textPrimary, textAlign: "center" }}>
        <h2>Unauthorized Access</h2>
        <p>You do not have permission to view store settings.</p>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put("http://localhost:5500/settings", {
        shopName, address, phone, taxRate, currency, receiptFooter
      }, {
        headers: { Authorization: "barear " + cookies.auth?.token }
      });
      snackbar.onResponse({ message: "Store settings saved successfully.", status: 200 });
    } catch (err) {
      console.error(err);
      snackbar.onResponse({ message: "Failed to save settings.", status: 500 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "40px", color: theme.palette.textPrimary, backgroundColor: theme.palette.paper, minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "30px" }}>Store Configuration</h2>

      {loading ? (
        <p>Loading settings...</p>
      ) : (
        <form onSubmit={handleSave} style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontWeight: "bold" }}>Shop Name</label>
            <Input value={shopName} onChange={(e: any) => setShopName(e.target.value)} placeholder="e.g. EM Market" width="100%" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontWeight: "bold" }}>Physical Address</label>
            <Input value={address} onChange={(e: any) => setAddress(e.target.value)} placeholder="e.g. 123 Main St, New York" width="100%" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontWeight: "bold" }}>Contact Phone</label>
            <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="e.g. +1 555-1234" width="100%" />
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
              <label style={{ fontWeight: "bold" }}>Tax Rate (%)</label>
              <Input type="number" value={taxRate} onChange={(e: any) => setTaxRate(parseFloat(e.target.value))} placeholder="e.g. 5" width="100%" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
              <label style={{ fontWeight: "bold" }}>Currency Symbol</label>
              <Input value={currency} onChange={(e: any) => setCurrency(e.target.value)} placeholder="e.g. $" width="100%" />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontWeight: "bold" }}>Receipt Footer Message</label>
            <Input value={receiptFooter} onChange={(e: any) => setReceiptFooter(e.target.value)} placeholder="e.g. Thank you for shopping with us!" width="100%" />
          </div>

          <div style={{ marginTop: "20px" }}>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Settings"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SettingsPage;
