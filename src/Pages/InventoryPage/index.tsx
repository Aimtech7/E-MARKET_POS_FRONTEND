import React, { FC, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import useTheme from "../../context/Theme/useTheme";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import Button from "../../Components/Button";
import Input from "../../Components/Input";
import PrintBarcodeModal from "../../Components/PrintBarcodeModal";
import style from "./style.module.css";

type Tab = "stock" | "history" | "suppliers" | "po";

const InventoryPage: FC = () => {
  const [cookies] = useCookies();
  const theme = useTheme();
  const snackbar = useSnackbar();
  
  const isAdmin = cookies.auth?.admin;

  const [activeTab, setActiveTab] = useState<Tab>("stock");
  const [products, setProducts] = useState<any[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Stock Adjustment Overlay
  const [isAdjustOpen, setIsAdjustOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [adjustSubmitting, setAdjustSubmitting] = useState<boolean>(false);
  const [adjustType, setAdjustType] = useState<"add" | "remove" | "adjust">("adjust");

  // Print Barcode Overlay
  const [isBarcodeOpen, setIsBarcodeOpen] = useState<boolean>(false);
  const [barcodeProduct, setBarcodeProduct] = useState<any | null>(null);

  // Supplier Form state
  const [supName, setSupName] = useState<string>("");
  const [supContact, setSupContact] = useState<string>("");
  const [supEmail, setSupEmail] = useState<string>("");
  const [supPhone, setSupPhone] = useState<string>("");
  const [supAddress, setSupAddress] = useState<string>("");
  const [supSubmitting, setSupSubmitting] = useState<boolean>(false);

  // PO Form Overlay state
  const [isPOOpen, setIsPOOpen] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [poItems, setPOItems] = useState<Array<{ product: string; qty: number; price: number }>>([]);
  const [poSubmitting, setPOSubmitting] = useState<boolean>(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5500/product/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryLogs = async () => {
    const token = cookies.auth?.token;
    try {
      const res = await axios.get("http://localhost:5500/inventory/logs", {
        headers: { Authorization: "barear " + token },
      });
      setInventoryLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuppliers = async () => {
    const token = cookies.auth?.token;
    try {
      const res = await axios.get("http://localhost:5500/supplier", {
        headers: { Authorization: "barear " + token },
      });
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPOs = async () => {
    const token = cookies.auth?.token;
    try {
      const res = await axios.get("http://localhost:5500/po", {
        headers: { Authorization: "barear " + token },
      });
      setPurchaseOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchInventoryLogs();
    fetchSuppliers();
    fetchPOs();
  }, [cookies.auth?.token]);

  // Handle manual stock adjustment
  const handleOpenAdjust = (prod: any, type: "add" | "remove" | "adjust" = "adjust") => {
    setSelectedProduct(prod);
    setAdjustQty(0);
    setAdjustReason("");
    setAdjustType(type);
    setIsAdjustOpen(true);
  };

  const handleAdjustStock = async () => {
    if (adjustQty === 0) {
      snackbar.onResponse({ message: "Adjustment quantity cannot be zero.", status: 400 });
      return;
    }

    setAdjustSubmitting(true);
    const token = cookies.auth?.token;

    try {
      let endpoint = "http://localhost:5500/inventory/adjust";
      if (adjustType === "add") endpoint = "http://localhost:5500/inventory/add";
      if (adjustType === "remove") endpoint = "http://localhost:5500/inventory/remove";

      await axios.post(
        endpoint,
        {
          productId: selectedProduct._id,
          quantity: adjustQty,
          reason: adjustReason,
        },
        {
          headers: { Authorization: "barear " + token },
        }
      );

      snackbar.onResponse({ message: "Inventory stock level adjusted.", status: 200 });
      setIsAdjustOpen(false);
      fetchProducts();
    } catch (err: any) {
      snackbar.onResponse({
        message: err.response?.data?.message || "Failed to adjust inventory stock.",
        status: 500,
      });
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Handle supplier creations
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) {
      snackbar.onResponse({ message: "Supplier name is required.", status: 400 });
      return;
    }

    setSupSubmitting(true);
    const token = cookies.auth?.token;

    try {
      await axios.post(
        "http://localhost:5500/supplier",
        {
          supplierName: supName,
          contactName: supContact,
          email: supEmail,
          phone: supPhone,
          address: supAddress,
        },
        {
          headers: { Authorization: "barear " + token },
        }
      );

      snackbar.onResponse({ message: "Supplier successfully created.", status: 201 });
      setSupName("");
      setSupContact("");
      setSupEmail("");
      setSupPhone("");
      setSupAddress("");
      fetchSuppliers();
    } catch (err: any) {
      snackbar.onResponse({
        message: err.response?.data?.message || "Failed to create supplier vendor.",
        status: 500,
      });
    } finally {
      setSupSubmitting(false);
    }
  };

  // Delete supplier CRUD
  const handleDeleteSupplier = async (id: string) => {
    const token = cookies.auth?.token;
    try {
      await axios.delete(`http://localhost:5500/supplier/${id}`, {
        headers: { Authorization: "barear " + token },
      });
      snackbar.onResponse({ message: "Supplier deleted.", status: 200 });
      fetchSuppliers();
    } catch (err: any) {
      snackbar.onResponse({ message: "Failed to delete supplier vendor.", status: 500 });
    }
  };

  // Handle new PO creation
  const handleOpenPO = () => {
    if (suppliers.length === 0) {
      snackbar.onResponse({ message: "Please register a supplier vendor first.", status: 400 });
      return;
    }
    setSelectedSupplier(suppliers[0]._id);
    setPOItems([{ product: products[0]?._id || "", qty: 10, price: products[0]?.price || 5 }]);
    setIsPOOpen(true);
  };

  const handleAddPOItem = () => {
    setPOItems([...poItems, { product: products[0]?._id || "", qty: 10, price: products[0]?.price || 5 }]);
  };

  const handleRemovePOItem = (idx: number) => {
    const updated = [...poItems];
    updated.splice(idx, 1);
    setPOItems(updated);
  };

  const handlePOItemChange = (idx: number, field: string, value: any) => {
    const updated = [...poItems];
    const target = updated[idx];
    if (field === "product") {
      target.product = value;
      const matchedProd = products.find((p) => p._id === value);
      target.price = matchedProd ? matchedProd.productPrice : 0;
    } else if (field === "qty") {
      target.qty = parseInt(value) || 0;
    } else if (field === "price") {
      target.price = parseFloat(value) || 0;
    }
    setPOItems(updated);
  };

  const handleCreatePO = async () => {
    if (poItems.length === 0) {
      snackbar.onResponse({ message: "Please specify at least one product restock item.", status: 400 });
      return;
    }

    setPOSubmitting(true);
    const token = cookies.auth?.token;
    const totalAmount = poItems.reduce((acc, i) => acc + i.qty * i.price, 0);

    try {
      await axios.post(
        "http://localhost:5500/po",
        {
          supplier: selectedSupplier,
          items: poItems,
          totalAmount,
        },
        {
          headers: { Authorization: "barear " + token },
        }
      );

      snackbar.onResponse({ message: "Purchase Order successfully formulated.", status: 201 });
      setIsPOOpen(false);
      fetchPOs();
    } catch (err: any) {
      snackbar.onResponse({ message: "Failed to create Purchase Order restock request.", status: 500 });
    } finally {
      setPOSubmitting(false);
    }
  };

  const handleTransitionPO = async (id: string, newStatus: string) => {
    const token = cookies.auth?.token;
    try {
      await axios.put(
        `http://localhost:5500/po/${id}/status`,
        { status: newStatus },
        {
          headers: { Authorization: "barear " + token },
        }
      );
      snackbar.onResponse({ message: `PO status updated to ${newStatus}.`, status: 200 });
      fetchPOs();
      fetchProducts(); // refresh products stock list if received
    } catch (err) {
      snackbar.onResponse({ message: "Failed to transition restock status.", status: 500 });
    }
  };

  return (
    <div className={style.container} style={{ backgroundColor: theme.palette.paper, color: theme.palette.textPrimary }}>
      <div className={style.header}>
        <h1>Stock & Restocking Management</h1>
        <div className={style.tabs}>
          <button
            onClick={() => setActiveTab("stock")}
            className={`${style.tabBtn} ${activeTab === "stock" ? style.activeTab : ""}`}
            style={{ color: theme.palette.textPrimary }}
          >
            Stock Levels & Alerts
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`${style.tabBtn} ${activeTab === "history" ? style.activeTab : ""}`}
            style={{ color: theme.palette.textPrimary }}
          >
            Inventory History
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab("suppliers")}
                className={`${style.tabBtn} ${activeTab === "suppliers" ? style.activeTab : ""}`}
                style={{ color: theme.palette.textPrimary }}
              >
                Supplier Directory
              </button>
              <button
                onClick={() => setActiveTab("po")}
                className={`${style.tabBtn} ${activeTab === "po" ? style.activeTab : ""}`}
                style={{ color: theme.palette.textPrimary }}
              >
                Purchase Orders
              </button>
            </>
          )}
        </div>
      </div>

      <div className={style.divider} style={{ backgroundColor: theme.palette.secondary }} />

      {/* Tab 1: Stock Levels & Alerts */}
      {activeTab === "stock" && (
        <div className={style.body}>
          <div className={style.subHeader}>
            <h3>Inventory Stock Ledger</h3>
            <p className={style.subHeaderInfo}>Displays current supermarket physical stock, reorder levels, and expiration alerts.</p>
          </div>

          <div className={style.tableWrapper}>
            {loading ? (
              <p className={style.loading}>Loading inventory database...</p>
            ) : products.length === 0 ? (
              <p className={style.empty}>No products available in database inventory.</p>
            ) : (
              <table className={style.table}>
                <thead>
                  <tr style={{ color: theme.palette.textSecondary }}>
                    <th>Image</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Stock Qty</th>
                    <th>Reorder Lvl</th>
                    <th>Price</th>
                    <th>Stock Alerts</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isLowStock = p.stockQuantity <= p.reorderLevel;
                    const isOutOfStock = p.stockQuantity === 0;

                    return (
                      <tr key={p._id} style={{ borderBottom: `1px solid ${theme.palette.secondary}22` }}>
                        <td><img src={"http://localhost:5500/" + p.productImage} alt={p.productName} style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover" }} /></td>
                        <td className={style.bold}>{p.productName}</td>
                        <td>{p.productCategory?.categoryName || "Uncategorized"}</td>
                        <td>{p.unitOfMeasure?.unitOfMeasureName || "Unit"}</td>
                        <td className={isLowStock ? style.lowText : ""}>{p.stockQuantity}</td>
                        <td>{p.reorderLevel}</td>
                        <td>Ksh {p.productPrice.toFixed(2)}</td>
                        <td>
                          {isOutOfStock ? (
                            <span className={`${style.alertBadge} ${style.out}`}>OUT OF STOCK</span>
                          ) : isLowStock ? (
                            <span className={`${style.alertBadge} ${style.low}`}>LOW STOCK ALERT</span>
                          ) : (
                            <span className={`${style.alertBadge} ${style.good}`}>ADEQUATE</span>
                          )}
                        </td>
                        <td>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenAdjust(p, "add")}
                                className={style.adjustBtn}
                                style={{ borderColor: "#2ecc71", color: "#2ecc71", marginRight: "5px" }}
                              >
                                Add Stock
                              </button>
                              <button
                                onClick={() => handleOpenAdjust(p, "remove")}
                                className={style.adjustBtn}
                                style={{ borderColor: "#e74c3c", color: "#e74c3c", marginRight: "5px" }}
                              >
                                Remove Stock
                              </button>
                              <button
                                onClick={() => handleOpenAdjust(p, "adjust")}
                                className={style.adjustBtn}
                                style={{ borderColor: theme.palette.primary, color: theme.palette.primary, marginRight: "5px" }}
                              >
                                Adjust Stock
                              </button>
                              <button
                                onClick={() => snackbar.onResponse({ message: "Edit coming soon.", status: 200 })}
                                className={style.adjustBtn}
                                style={{ borderColor: "#f39c12", color: "#f39c12", marginRight: "5px" }}
                              >
                                Edit Product
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await axios.delete(`http://localhost:5500/product/${p._id}`, { headers: { Authorization: "barear " + cookies.auth?.token } });
                                    snackbar.onResponse({ message: "Product archived.", status: 200 });
                                    fetchProducts();
                                  } catch (e) {
                                    snackbar.onResponse({ message: "Failed to archive product.", status: 500 });
                                  }
                                }}
                                className={style.adjustBtn}
                                style={{ borderColor: "#95a5a6", color: "#95a5a6", marginRight: "5px" }}
                              >
                                Archive Product
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setBarcodeProduct(p);
                              setIsBarcodeOpen(true);
                            }}
                            className={style.adjustBtn}
                            style={{ borderColor: theme.palette.textSecondary, color: theme.palette.textSecondary }}
                          >
                            Print Barcode
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab: Inventory History */}
      {activeTab === "history" && (
        <div className={style.body}>
          <div className={style.subHeader}>
            <h3>Inventory Audit Logs</h3>
            <p className={style.subHeaderInfo}>Immutable record of every physical stock movement (Sales, Restocks, Refunds, Adjustments).</p>
          </div>

          <div className={style.tableWrapper}>
            {inventoryLogs.length === 0 ? (
              <p className={style.empty}>No inventory history available.</p>
            ) : (
              <table className={style.table}>
                <thead>
                  <tr style={{ color: theme.palette.textSecondary }}>
                    <th>Timestamp</th>
                    <th>Product</th>
                    <th>Action Type</th>
                    <th>Quantity Affected</th>
                    <th>Reason / Note</th>
                    <th>Author</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLogs.map((log) => {
                    let color = theme.palette.textPrimary;
                    if (log.type === "restock" || log.type === "refund" || log.type === "add" || log.action === "add") color = "#2ecc71"; // Green for additions
                    else if (log.type === "sale" || log.type === "expiry_void" || log.type === "remove" || log.action === "remove") color = "#e74c3c"; // Red for deductions
                    else if (log.type === "adjustment" || log.action === "adjust") color = log.qty > 0 ? "#2ecc71" : "#e74c3c";

                    return (
                      <tr key={log._id} style={{ borderBottom: `1px solid ${theme.palette.secondary}22` }}>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td className={style.bold}>{log.product?.productName || "Unknown Product"}</td>
                        <td>
                          <span style={{ fontWeight: "bold", textTransform: "capitalize", color }}>
                            {log.action || log.type}
                          </span>
                        </td>
                        <td style={{ color, fontWeight: "bold" }}>
                          {(log.type === "restock" || log.type === "refund" || log.type === "add" || log.action === "add" || ((log.type === "adjustment" || log.action === "adjust") && log.qty > 0)) ? "+" : ""}
                          {log.qty}
                        </td>
                        <td>{log.reason || "-"}</td>
                        <td>{log.userId?.username || "System"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Supplier Directory */}
      {activeTab === "suppliers" && (
        <div className={style.suppliersGrid}>
          {/* Supplier Table */}
          <div className={style.suppliersList}>
            <h3>Registered Supplier Vendors</h3>
            <div className={style.tableWrapper} style={{ marginTop: "10px" }}>
              {suppliers.length === 0 ? (
                <p className={style.empty}>No suppliers currently registered.</p>
              ) : (
                <table className={style.table}>
                  <thead>
                    <tr style={{ color: theme.palette.textSecondary }}>
                      <th>Supplier Name</th>
                      <th>Contact Name</th>
                      <th>Contact Details</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((s) => (
                      <tr key={s._id} style={{ borderBottom: `1px solid ${theme.palette.secondary}22` }}>
                        <td className={style.bold}>{s.supplierName}</td>
                        <td>{s.contactName || "-"}</td>
                        <td>
                          <div className={style.contactDetails}>
                            <span>Email: {s.email || "-"}</span>
                            <span>Phone: {s.phone || "-"}</span>
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteSupplier(s._id)}
                            className={style.deleteBtn}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Create Supplier Form */}
          <div className={style.supplierFormCard} style={{ backgroundColor: theme.palette.paper, boxShadow: `0 2px 8px ${theme.palette.shadow}` }}>
            <h3>Register Vendor</h3>
            <form onSubmit={handleCreateSupplier} className={style.form}>
              <div className={style.formGroup}>
                <label>Supplier Name *</label>
                <Input value={supName} onChange={(e: any) => setSupName(e.target.value)} placeholder="e.g. ABC Foods Ltd" width="100%" />
              </div>
              <div className={style.formGroup}>
                <label>Contact Name</label>
                <Input value={supContact} onChange={(e: any) => setSupContact(e.target.value)} placeholder="e.g. John Doe" width="100%" />
              </div>
              <div className={style.formGroup}>
                <label>Email Address</label>
                <Input value={supEmail} onChange={(e: any) => setSupEmail(e.target.value)} type="email" placeholder="e.g. sales@abcfoods.com" width="100%" />
              </div>
              <div className={style.formGroup}>
                <label>Phone Number</label>
                <Input value={supPhone} onChange={(e: any) => setSupPhone(e.target.value)} placeholder="e.g. +123-456-789" width="100%" />
              </div>
              <div className={style.formGroup}>
                <label>Physical Address</label>
                <Input value={supAddress} onChange={(e: any) => setSupAddress(e.target.value)} placeholder="e.g. Warehouse 4B, Industrial Area" width="100%" />
              </div>
              <Button type="submit" variant="error" fullWidth disabled={supSubmitting}>
                {supSubmitting ? "Saving..." : "Create Supplier"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Purchase Orders */}
      {activeTab === "po" && (
        <div className={style.body}>
          <div className={style.subHeader}>
            <h3>Restocking Purchase Orders</h3>
            <Button onClick={handleOpenPO} variant="primary">New Purchase Order</Button>
          </div>

          <div className={style.tableWrapper}>
            {purchaseOrders.length === 0 ? (
              <p className={style.empty}>No restocking purchase orders registered yet.</p>
            ) : (
              <table className={style.table}>
                <thead>
                  <tr style={{ color: theme.palette.textSecondary }}>
                    <th>PO Number</th>
                    <th>Date Created</th>
                    <th>Supplier Vendor</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Restock Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po._id} style={{ borderBottom: `1px solid ${theme.palette.secondary}22` }}>
                      <td className={style.bold}>{po.poNumber}</td>
                      <td>{new Date(po.timestamp).toLocaleDateString()}</td>
                      <td>{po.supplier?.supplierName || "Deleted Supplier"}</td>
                      <td className={style.price}>Ksh {po.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`${style.poBadge} ${style[po.status]}`}>{po.status}</span>
                      </td>
                      <td>
                        <div className={style.poActions}>
                          {po.status === "Draft" && (
                            <button
                              onClick={() => handleTransitionPO(po._id, "Ordered")}
                              className={style.orderedBtn}
                            >
                              Dispatch Order
                            </button>
                          )}
                          {po.status === "Ordered" && (
                            <button
                              onClick={() => handleTransitionPO(po._id, "Received")}
                              className={style.receivedBtn}
                            >
                              Receive Items
                            </button>
                          )}
                          {po.status !== "Received" && po.status !== "Cancelled" && (
                            <button
                              onClick={() => handleTransitionPO(po._id, "Cancelled")}
                              className={style.cancelBtn}
                            >
                              Cancel PO
                            </button>
                          )}
                          {(po.status === "Received" || po.status === "Cancelled") && (
                            <span className={style.disabledText}>Closed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Stock Adjustment Overlay */}
      {isAdjustOpen && selectedProduct && (
        <div className={style.overlay}>
          <div className={style.modal} style={{ backgroundColor: theme.palette.paper }}>
            <div className={style.modalHeader}>
              <h3>{adjustType === "add" ? "Add Stock" : adjustType === "remove" ? "Remove Stock" : "Adjust Stock Levels"}: {selectedProduct.productName}</h3>
              <button className={style.closeBtn} onClick={() => setIsAdjustOpen(false)}>&times;</button>
            </div>
            <div className={style.modalBody}>
              <p className={style.modalSubText}>
                {adjustType === "add" && "Increase physical inventory count."}
                {adjustType === "remove" && "Decrease physical inventory count."}
                {adjustType === "adjust" && "Force a specific adjustment to physical inventory (+ or -)."}
              </p>
              
              <div className={style.currentStockDisplay} style={{ backgroundColor: theme.palette.secondary + "22" }}>
                <span>Current Stock Level:</span>
                <span className={style.bold}>{selectedProduct.stockQuantity}</span>
              </div>

              <div className={style.formGroup}>
                <label>Stock Quantity to {adjustType === "add" ? "Add" : adjustType === "remove" ? "Remove" : "Adjust (Add/Deduct)"}</label>
                <Input
                  type="number"
                  value={adjustQty}
                  onChange={(e: any) => setAdjustQty(parseInt(e.target.value) || 0)}
                  width="100%"
                />
              </div>

              <div className={style.formGroup} style={{ marginTop: "15px" }}>
                <label>Reason for Adjustment</label>
                <Input
                  value={adjustReason}
                  onChange={(e: any) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Audit reconciliation, Spillage, Broken case"
                  width="100%"
                />
              </div>

              <div className={style.modalActions}>
                <Button onClick={handleAdjustStock} variant="primary" fullWidth disabled={adjustSubmitting}>
                  {adjustSubmitting ? "Adjusting..." : "Process Adjustment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PO Creation Overlay */}
      {isPOOpen && (
        <div className={style.overlay}>
          <div className={style.modal} style={{ width: "600px", maxWidth: "90%", backgroundColor: theme.palette.paper }}>
            <div className={style.modalHeader}>
              <h3>Formulate Restocking Purchase Order</h3>
              <button className={style.closeBtn} onClick={() => setIsPOOpen(false)}>&times;</button>
            </div>
            <div className={style.modalBody}>
              <div className={style.formGroup}>
                <label>Supplier Vendor</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className={style.select}
                  style={{
                    backgroundColor: theme.palette.paper,
                    color: theme.palette.textPrimary,
                    borderColor: theme.palette.secondary,
                    width: "100%",
                  }}
                >
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.supplierName}</option>
                  ))}
                </select>
              </div>

              <div className={style.poItemsHeader} style={{ marginTop: "15px" }}>
                <h4>Stock Restocking Items</h4>
                <button onClick={handleAddPOItem} className={style.addBtn}>+ Add Item</button>
              </div>

              <div className={style.poItemsList}>
                {poItems.map((item, idx) => (
                  <div key={idx} className={style.poItemRow}>
                    <select
                      value={item.product}
                      onChange={(e) => handlePOItemChange(idx, "product", e.target.value)}
                      className={style.select}
                      style={{
                        backgroundColor: theme.palette.paper,
                        color: theme.palette.textPrimary,
                        borderColor: theme.palette.secondary,
                        flex: 2,
                      }}
                    >
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>{p.productName}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handlePOItemChange(idx, "qty", e.target.value)}
                      className={style.dateInput}
                      style={{ flex: 1, minWidth: "60px" }}
                      placeholder="Qty"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handlePOItemChange(idx, "price", e.target.value)}
                      className={style.dateInput}
                      style={{ flex: 1, minWidth: "70px" }}
                      placeholder="Unit Price (Ksh)"
                    />

                    <button onClick={() => handleRemovePOItem(idx)} className={style.removeBtn}>&times;</button>
                  </div>
                ))}
              </div>

              <div className={style.poSummary} style={{ marginTop: "15px" }}>
                <span>Total PO Amount:</span>
                <span className={style.bold}>
                  Ksh {poItems.reduce((acc, i) => acc + i.qty * i.price, 0).toFixed(2)}
                </span>
              </div>

              <div className={style.modalActions}>
                <Button onClick={handleCreatePO} variant="primary" fullWidth disabled={poSubmitting}>
                  {poSubmitting ? "Drafting..." : "Submit PO RESTOCK"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PrintBarcodeModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        product={barcodeProduct}
      />
    </div>
  );
};

export default InventoryPage;
