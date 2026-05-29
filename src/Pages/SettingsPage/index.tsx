import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import useTheme from "../../context/Theme/useTheme";
import Button from "../../Components/Button";
import Input from "../../Components/Input";
import useSnackbar from "../../context/Snackbar/useSnackbar";

type Tab = "general" | "store_info" | "receipts" | "taxes" | "users" | "security" | "backups";

const SettingsPage: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const snackbar = useSnackbar();
  
  const isAdmin = cookies.auth?.admin;

  const [activeTab, setActiveTab] = useState<Tab>("general");
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "store_info", label: "Store Information" },
    { id: "receipts", label: "Receipts" },
    { id: "taxes", label: "Taxes" },
    { id: "users", label: "Users" },
    { id: "security", label: "Security" },
    { id: "backups", label: "Backups" },
  ];

  return (
    <div style={{ padding: "40px", color: theme.palette.textPrimary, backgroundColor: theme.palette.paper, minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "30px" }}>Store Configuration</h2>

      <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
        {/* Vertical Tabs Navigation */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "5px", 
          minWidth: "200px",
          borderRight: `1px solid rgba(255, 255, 255, 0.1)`,
          paddingRight: "20px"
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 16px",
                textAlign: "left",
                backgroundColor: activeTab === tab.id ? "rgba(37, 99, 235, 0.15)" : "transparent",
                color: activeTab === tab.id ? "var(--color-primary)" : "var(--color-text-secondary)",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontWeight: activeTab === tab.id ? "bold" : "normal",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, maxWidth: "600px" }}>
          {loading ? (
            <p>Loading settings...</p>
          ) : (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {activeTab === "general" && (
                <>
                  <h3>General Settings</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold" }}>Currency Symbol</label>
                    <Input value={currency} onChange={(e: any) => setCurrency(e.target.value)} placeholder="e.g. $" width="100%" />
                  </div>
                </>
              )}

              {activeTab === "store_info" && (
                <>
                  <h3>Store Information</h3>
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
                </>
              )}

              {activeTab === "receipts" && (
                <>
                  <h3>Receipt Settings</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold" }}>Receipt Footer Message</label>
                    <Input value={receiptFooter} onChange={(e: any) => setReceiptFooter(e.target.value)} placeholder="e.g. Thank you for shopping with us!" width="100%" />
                  </div>
                </>
              )}

              {activeTab === "taxes" && (
                <>
                  <h3>Tax Configurations</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontWeight: "bold" }}>Default Tax Rate (%)</label>
                    <Input type="number" value={taxRate} onChange={(e: any) => setTaxRate(parseFloat(e.target.value))} placeholder="e.g. 5" width="100%" />
                  </div>
                </>
              )}

              {(activeTab === "users" || activeTab === "security" || activeTab === "backups") && (
                <>
                  <h3>{tabs.find(t => t.id === activeTab)?.label}</h3>
                  <p style={{ opacity: 0.7 }}>This section is managed via the Dashboard or dedicated Admin views.</p>
                </>
              )}

              <div style={{ marginTop: "30px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" }}>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving Changes..." : "Save Settings"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
