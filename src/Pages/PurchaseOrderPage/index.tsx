import React, { FC, useState, useEffect } from "react";
import style from "./style.module.css";
import useTheme from "../../context/Theme/useTheme";
import { useCookies } from "react-cookie";
import axios from "axios";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import Button from "../../Components/Button";

type Product = {
  _id: string;
  productName: string;
  costPrice: number;
};

type Supplier = {
  _id: string;
  id: string;
  supplierName: string;
  isActive: boolean;
};

type POItem = {
  product: string | Product;
  qty: number;
  price: number;
};

type PurchaseOrder = {
  _id: string;
  poNumber: string;
  supplier: Supplier;
  items: POItem[];
  status: string;
  totalAmount: number;
  timestamp: string;
};

const PurchaseOrderPage: FC = () => {
  const theme = useTheme();
  const [cookies] = useCookies(["auth"]);
  const snack = useSnackbar();

  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  
  // Create PO Form State
  const [showCreate, setShowCreate] = useState(false);
  const [newPoSupplier, setNewPoSupplier] = useState<string>("");
  const [newPoItems, setNewPoItems] = useState<POItem[]>([]);

  const config = { headers: { Authorization: "Bearer " + cookies.auth?.token } };

  const fetchPOs = () => {
    axios.get("/po", config)
      .then(res => setPos(res.data))
      .catch(err => snack.onResponse({ message: "Failed to load POs", status: 500 }));
  };

  const fetchDependencies = () => {
    axios.get("/supplier/suppliers", config)
      .then(res => setSuppliers(res.data.filter((s:any) => s.isActive !== false)));
    
    axios.get("/product/products", config)
      .then(res => setProducts(res.data));
  };

  useEffect(() => {
    fetchPOs();
    fetchDependencies();
  }, []);

  const handleCreatePO = () => {
    if (!newPoSupplier) return snack.onResponse({ message: "Select a supplier", status: 400 });
    if (newPoItems.length === 0) return snack.onResponse({ message: "Add at least one item", status: 400 });

    const totalAmount = newPoItems.reduce((acc, item) => acc + (item.qty * item.price), 0);

    const payload = {
      supplier: newPoSupplier,
      items: newPoItems.map(i => ({ product: typeof i.product === 'string' ? i.product : i.product._id, qty: i.qty, price: i.price })),
      totalAmount
    };

    axios.post("/po", payload, config)
      .then(res => {
        snack.onResponse({ message: "PO Created", status: 201 });
        setShowCreate(false);
        setNewPoItems([]);
        setNewPoSupplier("");
        fetchPOs();
      })
      .catch(err => snack.onResponse({ message: err.response?.data?.message || "Error", status: 500 }));
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    axios.put(`/po/${id}/status`, { status: newStatus }, config)
      .then(res => {
        snack.onResponse({ message: `PO marked as ${newStatus}`, status: 200 });
        setSelectedPO(null);
        fetchPOs();
      })
      .catch(err => snack.onResponse({ message: err.response?.data?.message || "Error", status: 500 }));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this PO?")) return;
    axios.delete(`/po/${id}`, config)
      .then(res => {
        snack.onResponse({ message: "PO Deleted", status: 200 });
        setSelectedPO(null);
        fetchPOs();
      })
      .catch(err => snack.onResponse({ message: err.response?.data?.message || "Error", status: 500 }));
  };

  const addItem = () => {
    setNewPoItems([...newPoItems, { product: "", qty: 1, price: 0 }]);
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const updated = [...newPoItems];
    if (field === 'product') {
      const prod = products.find(p => p._id === value);
      updated[index] = { ...updated[index], product: value, price: prod?.costPrice || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setNewPoItems(updated);
  };

  const removeItem = (index: number) => {
    setNewPoItems(newPoItems.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Draft': return '#9e9e9e';
      case 'Ordered': return '#2196f3';
      case 'Received': return '#4caf50';
      case 'Cancelled': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  return (
    <div className={style.container}>
      <div className={style.list} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: theme.palette.textPrimary }}>PURCHASE ORDERS</h1>
          <Button variant="primary" onClick={() => { setShowCreate(true); setSelectedPO(null); }}>+ NEW PO</Button>
        </div>
        
        <div style={{ backgroundColor: theme.palette.paper, borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: theme.palette.textPrimary }}>
            <thead style={{ backgroundColor: theme.palette.primary, color: 'white' }}>
              <tr>
                <th style={{ padding: '12px' }}>PO #</th>
                <th style={{ padding: '12px' }}>Supplier</th>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Total</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pos.map(p => (
                <tr 
                  key={p._id} 
                  style={{ 
                    cursor: 'pointer', 
                    backgroundColor: selectedPO?._id === p._id ? theme.palette.shadow : 'transparent',
                    borderBottom: '1px solid ' + theme.palette.shadow
                  }}
                  onClick={() => { setSelectedPO(p); setShowCreate(false); }}
                >
                  <td style={{ padding: '12px' }}>{p.poNumber}</td>
                  <td style={{ padding: '12px' }}>{p.supplier?.supplierName || "Unknown"}</td>
                  <td style={{ padding: '12px' }}>{new Date(p.timestamp).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>${p.totalAmount.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      backgroundColor: getStatusColor(p.status), 
                      color: '#fff' 
                    }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {pos.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>No purchase orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showCreate || selectedPO) && (
        <div className={style.info} style={{ backgroundColor: theme.palette.paper, boxShadow: "0 2px 8px " + theme.palette.shadow, color: theme.palette.textPrimary, padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
          
          {showCreate && (
            <>
              <h2>CREATE PURCHASE ORDER</h2>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Supplier</label>
                <select 
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  value={newPoSupplier}
                  onChange={e => setNewPoSupplier(e.target.value)}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.supplierName}</option>)}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3>Items</h3>
                  <Button variant="secondary" onClick={addItem}>Add Item</Button>
                </div>
                
                {newPoItems.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <select 
                      style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      value={typeof item.product === 'string' ? item.product : item.product._id}
                      onChange={e => updateItem(index, 'product', e.target.value)}
                    >
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.productName}</option>)}
                    </select>
                    <input 
                      type="number" 
                      placeholder="Qty" 
                      style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
                      value={item.qty} 
                      onChange={e => updateItem(index, 'qty', Number(e.target.value))} 
                    />
                    <input 
                      type="number" 
                      placeholder="Price" 
                      style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
                      value={item.price} 
                      onChange={e => updateItem(index, 'price', Number(e.target.value))} 
                    />
                    <Button variant="error" onClick={() => removeItem(index)}>X</Button>
                  </div>
                ))}
              </div>
              
              <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'right' }}>
                Total: ${newPoItems.reduce((acc, item) => acc + (item.qty * item.price), 0).toFixed(2)}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <Button variant="primary" fullWidth onClick={handleCreatePO}>CREATE PO</Button>
                <Button variant="secondary" fullWidth onClick={() => setShowCreate(false)}>CANCEL</Button>
              </div>
            </>
          )}

          {selectedPO && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>PO: {selectedPO.poNumber}</h2>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  backgroundColor: getStatusColor(selectedPO.status), 
                  color: '#fff' 
                }}>
                  {selectedPO.status}
                </span>
              </div>
              
              <p><strong>Supplier:</strong> {selectedPO.supplier?.supplierName}</p>
              <p><strong>Date:</strong> {new Date(selectedPO.timestamp).toLocaleString()}</p>
              
              <h3>Items</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid ' + theme.palette.shadow }}>
                <thead style={{ backgroundColor: theme.palette.shadow }}>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Product</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Cost</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid ' + theme.palette.shadow }}>
                      <td style={{ padding: '8px' }}>{typeof item.product === 'object' ? item.product.productName : "Unknown"}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{item.qty}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>${(item.qty * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'right', marginTop: '10px' }}>
                Total: ${selectedPO.totalAmount.toFixed(2)}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: 'wrap' }}>
                {selectedPO.status === "Draft" && (
                  <Button variant="primary" fullWidth onClick={() => handleUpdateStatus(selectedPO._id, "Ordered")}>MARK AS ORDERED</Button>
                )}
                {(selectedPO.status === "Draft" || selectedPO.status === "Ordered") && (
                  <Button variant="success" fullWidth onClick={() => handleUpdateStatus(selectedPO._id, "Received")}>MARK AS RECEIVED</Button>
                )}
                {selectedPO.status !== "Received" && selectedPO.status !== "Cancelled" && (
                  <Button variant="error" fullWidth onClick={() => handleUpdateStatus(selectedPO._id, "Cancelled")}>CANCEL PO</Button>
                )}
                {selectedPO.status !== "Received" && (
                  <Button variant="error" fullWidth onClick={() => handleDelete(selectedPO._id)}>DELETE</Button>
                )}
                <Button variant="secondary" fullWidth onClick={() => setSelectedPO(null)}>CLOSE</Button>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
};

export default PurchaseOrderPage;
