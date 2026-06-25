import React, { FC, useState, useEffect } from "react";
import style from "./style.module.css";
import useTheme from "../../context/Theme/useTheme";
import { useCookies } from "react-cookie";
import axios from "axios";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import Button from "../../Components/Button";
import TextField from "../../Components/TextField";
import { Form, Formik } from "formik";
import * as yup from "yup";

type Supplier = {
  id: string;
  supplierName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
};

const supplierSchema = yup.object().shape({
  supplierName: yup.string().required("Supplier Name is required"),
  contactName: yup.string(),
  email: yup.string().email("Invalid email"),
  phone: yup.string(),
  address: yup.string(),
  isActive: yup.boolean()
});

let submitAction: "add" | "update" | "delete" | undefined = undefined;

const SupplierPage: FC = () => {
  const theme = useTheme();
  const [cookies] = useCookies(["auth"]);
  const snack = useSnackbar();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = () => {
    setLoading(true);
    axios.get("/supplier/suppliers", {
      headers: { Authorization: "Bearer " + cookies.auth?.token }
    })
      .then(res => {
        setSuppliers(res.data);
      })
      .catch(err => {
        snack.onResponse({ message: "Failed to load suppliers", status: 500 });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  let selectedSupplier = suppliers.find(s => s.id === selectedSupplierId) || null;

  const onSubmitHandler = (values: any, { resetForm }: any) => {
    const config = { headers: { Authorization: "Bearer " + cookies.auth?.token } };

    if (submitAction === "add") {
      axios.post("/supplier/new", values, config)
        .then(res => {
          snack.onResponse({ message: res.data.message, status: res.status });
          fetchSuppliers();
          resetForm();
        })
        .catch(err => snack.onResponse({ message: err.response?.data?.message || "Error", status: err.response?.status || 500 }));
    } else if (submitAction === "update") {
      axios.put("/supplier/update/" + values.id, values, config)
        .then(res => {
          snack.onResponse({ message: res.data.message, status: res.status });
          fetchSuppliers();
        })
        .catch(err => snack.onResponse({ message: err.response?.data?.message || "Error", status: err.response?.status || 500 }));
    } else if (submitAction === "delete") {
      axios.delete("/supplier/delete/" + values.id, config)
        .then(res => {
          snack.onResponse({ message: res.data.message, status: res.status });
          setSelectedSupplierId("");
          fetchSuppliers();
        })
        .catch(err => snack.onResponse({ message: err.response?.data?.message || "Error", status: err.response?.status || 500 }));
    }
  };

  return (
    <div className={style.container}>
      <div className={style.list} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h1 style={{ color: theme.palette.textPrimary }}>SUPPLIERS</h1>
        
        <div style={{ backgroundColor: theme.palette.paper, borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: theme.palette.textPrimary }}>
            <thead style={{ backgroundColor: theme.palette.primary, color: 'white' }}>
              <tr>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Contact</th>
                <th style={{ padding: '12px' }}>Phone</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr 
                  key={s.id} 
                  style={{ 
                    cursor: 'pointer', 
                    backgroundColor: selectedSupplierId === s.id ? theme.palette.shadow : 'transparent',
                    borderBottom: '1px solid ' + theme.palette.shadow
                  }}
                  onClick={() => setSelectedSupplierId(s.id)}
                >
                  <td style={{ padding: '12px' }}>{s.supplierName}</td>
                  <td style={{ padding: '12px' }}>{s.contactName || '-'}</td>
                  <td style={{ padding: '12px' }}>{s.phone || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      backgroundColor: s.isActive ? '#4caf50' : '#f44336', 
                      color: '#fff' 
                    }}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>No suppliers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={style.info} style={{ backgroundColor: theme.palette.paper, boxShadow: "0 2px 8px " + theme.palette.shadow }}>
        <Formik
          onSubmit={onSubmitHandler}
          validationSchema={supplierSchema}
          enableReinitialize
          initialValues={{
            id: selectedSupplier?.id || "",
            supplierName: selectedSupplier?.supplierName || "",
            contactName: selectedSupplier?.contactName || "",
            email: selectedSupplier?.email || "",
            phone: selectedSupplier?.phone || "",
            address: selectedSupplier?.address || "",
            isActive: selectedSupplier ? selectedSupplier.isActive : true
          }}
        >
          {({ handleSubmit, values, setFieldValue }) => (
            <Form className={style.form} style={{ color: theme.palette.textPrimary }}>
              <h1>{selectedSupplier ? "EDIT SUPPLIER" : "NEW SUPPLIER"}</h1>

              <TextField placeholder="Supplier Name" width="100%" name="supplierName" />
              <TextField placeholder="Contact Person" width="100%" name="contactName" />
              <TextField placeholder="Email" width="100%" type="email" name="email" />
              <TextField placeholder="Phone Number" width="100%" name="phone" />
              <TextField placeholder="Address" width="100%" name="address" />

              {selectedSupplier && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={values.isActive} 
                      onChange={(e) => setFieldValue('isActive', e.target.checked)} 
                    />
                    Active
                  </label>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                {!selectedSupplier ? (
                  <Button variant="primary" fullWidth onClick={() => { submitAction = "add"; handleSubmit(); }}>
                    CREATE SUPPLIER
                  </Button>
                ) : (
                  <>
                    <Button variant="warning" fullWidth onClick={() => { submitAction = "update"; handleSubmit(); }}>
                      UPDATE
                    </Button>
                    <Button variant="error" fullWidth onClick={() => { submitAction = "delete"; handleSubmit(); }}>
                      DELETE
                    </Button>
                    <Button variant="secondary" fullWidth onClick={() => { setSelectedSupplierId(""); }}>
                      CANCEL
                    </Button>
                  </>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default SupplierPage;
