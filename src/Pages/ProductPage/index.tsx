import React, { ChangeEvent, FC, useEffect, useState } from "react";
import style from "./style.module.css";
import useTheme from "../../context/Theme/useTheme";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/Reducers";
import ProductRow from "../../Components/ProductRow";
import Button from "../../Components/Button";
import TextField from "../../Components/TextField";
import { Form, Formik } from "formik";
import SelectField from "../../Components/SelectFeild";
import ImagePicker from "../../Components/ImagePicker";
import { addProduct, removeProduct, set_categories, set_products, set_units, updateProduct } from "../../store/Actions";
import { productShcema } from "../../schema";
import Select from "../../Components/Select";
import SearchField from "../../Components/SearchField";
import axios from "axios";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import { useCookies } from "react-cookie";
/**
 * ## Product Page
 * Product page the page that allow to handle the Product itself in the system.
 * By edit, delete or create new product. The product can take these values.
 * ```ts
 * type Product = {
 * productName: string,
 * productCode: string,
 * productCategory: Category,
 * productImage: string,
 * ProductPrice, double,
 * unitOfMeasure: UnitOfMeasure,
 * }
 * ```
 * Each Product can have one category and one unitOfMeasure.
 */
const ProductPage: FC = () => {
  const snack = useSnackbar();
  const theme = useTheme();
  // selectedProduct select the product id
  const [selectedProduct, setSlectedProduct] = useState<string>("");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [cookies] = useCookies(["auth"]);
  const dispatch = useDispatch();

  const fetchProducts = () => {
    axios
      .get(`/product/products?includeArchived=${showArchived}`, {
        headers: { Authorization: "Bearer " + cookies.auth?.token }
      })
      .then((res) => dispatch(set_products(res.data)))
      .catch((err) => {
        alert(err.response?.data?.message || err.message);
      });
  };

  useEffect(() => {
    axios
      .get("/category/categories", {
        headers: { Authorization: "Bearer " + cookies.auth?.token }
      })
      .then((res) => dispatch(set_categories(res.data)))
      .catch((err) => {
        alert(err.response?.data?.message || err.message);
      });
    fetchProducts();
    axios
      .get("/unit/units", {
        headers: { Authorization: "Bearer " + cookies.auth?.token }
      })
      .then((res) => dispatch(set_units(res.data)))
      .catch((err) => {
        alert(err.response?.data?.message || err.message);
      });
  }, [dispatch, showArchived]);
  // GET products from the redux store
  const products = useSelector<RootState>(
    (state) => state.productsReducer
  ) as Product[];
  // GET categories from the redux store
  const categories = useSelector<RootState>(
    (state) => state.categoriessReducer
  ) as Category[];
  // GET unit of measures from the redux store
  const unitOfMeasures = useSelector<RootState>(
    (state) => state.unitOfMeasureReducer
  ) as UnitOfMeasure[];
  const selectProductHandler = (id: string) => {
    setSlectedProduct(id);
  };
  // after selecting the product id we have to find the correct item
  let selectedItem = products.find((p) => p.id === selectedProduct) as any;
  let submitAction: "add" | "update" | "delete" | "archive" | "restore" | undefined = undefined;
  const [searchValue, setSearcchValue] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    unitOfMeasure: "all",
  });

  // Search filters applied when the search value changed or the filtersValues changed
  let items: Product[] = [...products].filter(
    (p) =>
      (filters.category === "all"
        ? true
        : p.category.categoryName === filters.category) &&
      (filters.unitOfMeasure === "all"
        ? true
        : p.unitOfMeasure.unitOfMeasureName === filters.unitOfMeasure) &&
      (p.category.categoryName === searchValue ||
        p.title.startsWith(searchValue) ||
        (p.title + " " + p.unitOfMeasure).startsWith(searchValue) ||
        p.unitOfMeasure.unitOfMeasureName.startsWith(searchValue))
  );
  const searchHandler = (value: string) => {
    setSearcchValue(value);
  };
  const onChangeCategoryFilterHandler = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    setFilters((p) => {
      return { ...p, category: event.target.value };
    });
  };
  const onSubmitHandler = (values: any) => {
    let formData = new FormData();
    formData.append("productName", values.title);
    formData.append("productCategory", values.category);
    formData.append("unitOfMeasure", values.unit);
    formData.append("productPrice", values.price);
    if (values.sku) formData.append("sku", values.sku);
    if (values.barcode) formData.append("barcode", values.barcode);
    if (values.reorderLevel !== undefined) formData.append("reorderLevel", values.reorderLevel);
    if (values.costPrice !== undefined) formData.append("costPrice", values.costPrice);
    if (values.sellingPrice !== undefined) formData.append("sellingPrice", values.sellingPrice);
    if (values.profitMargin !== undefined) formData.append("profitMargin", values.profitMargin);
    formData.append("image", values.image.img);

    if (submitAction === "add") {
      axios
        .post("/product/new", formData, {
          headers: { Authorization: "Bearer " + cookies.auth?.token }
        })
        .then((res) => {
          snack.onResponse({
            message: "Product "+ res.data.id+" have been Created",
            status: res.status,
          });
          dispatch(
            addProduct({
              id: res.data.id,
              title: values.title,
              price: values.price,
              sku: res.data.product?.sku,
              barcode: res.data.product?.barcode,
              reorderLevel: res.data.product?.reorderLevel,
              costPrice: res.data.product?.costPrice,
              sellingPrice: res.data.product?.sellingPrice,
              profitMargin: res.data.product?.profitMargin,
              category: { categoryName: values.category } as Category,
              media: values.image.preview,
              unitOfMeasure: { unitOfMeasureName: values.unit, baseUnitOfMeasure: values.unit, conversionFactor: 1 } as UnitOfMeasure,
            } as Product)
          );
        })
        .catch((err) => {
          snack.onResponse({
            message: err.response?.data?.message || err.message,
            status: err.response?.status || 500,
          });
        });
    } else if (submitAction === "update") {
      axios
        .post("/product/update/" + values.id, formData, {
          headers: { Authorization: "Bearer " + cookies.auth?.token }
        })
        .then((res) => {
          snack.onResponse({
            message: res.data.message,
            status: res.status,
          });
          dispatch(
            updateProduct(values.id, {
              id: values.id,
              title: values.title,
              price: values.price,
              sku: values.sku,
              barcode: values.barcode,
              reorderLevel: values.reorderLevel,
              costPrice: values.costPrice,
              sellingPrice: values.sellingPrice,
              profitMargin: values.profitMargin,
              category: { categoryName: values.category } as Category,
              media: values.image.preview,
              unitOfMeasure: { unitOfMeasureName: values.unit, baseUnitOfMeasure: values.unit, conversionFactor: 1 } as UnitOfMeasure,
            } as Product)
          );
        })
        .catch((err) => {
          snack.onResponse({
            message: err.response?.data?.message || err.message,
            status: err.response?.status || 500,
          });
        });
    } else if (submitAction === "delete") {
      axios
        .delete("/product/delete/" + values.id, {
          headers: { Authorization: "Bearer " + cookies.auth?.token }
        })
        .then((res) => {
          snack.onResponse({
            message: res.data.message,
            status: res.status,
          });
          dispatch(removeProduct(values.id));
        })
        .catch((err) => {
          snack.onResponse({
            message: err.response?.data?.message || err.message,
            status: err.response?.status || 500,
          });
        });
    } else if (submitAction === "archive") {
      axios.put("/product/archive/" + values.id, null, { headers: { Authorization: "Bearer " + cookies.auth?.token }})
        .then((res) => {
          snack.onResponse({ message: res.data.message, status: res.status });
          fetchProducts();
        })
        .catch((err) => snack.onResponse({ message: err.response?.data?.message, status: err.response?.status }));
    } else if (submitAction === "restore") {
      axios.put("/product/restore/" + values.id, null, { headers: { Authorization: "Bearer " + cookies.auth?.token }})
        .then((res) => {
          snack.onResponse({ message: res.data.message, status: res.status });
          fetchProducts();
        })
        .catch((err) => snack.onResponse({ message: err.response?.data?.message, status: err.response?.status }));
    }
  };
  const onChangeUnitOfMeasureFilterHandler = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    setFilters((p) => {
      return { ...p, unitOfMeasure: event.target.value };
    });
  };

  return (
    <div
      // container of the entire page excpt navbar
      className={style.container}
    >
      <div className={style.list}>
        <div className={style.filterControls}>
          <h1 style={{ color: theme.palette.textPrimary }}>EMMARKET</h1>
          <SearchField className={style.searchBar} onChange={searchHandler} />
          <Select
            onChange={onChangeCategoryFilterHandler}
            options={categories.map((cate) => {
              if (cate.categoryName)
                return { key: cate.categoryName, value: cate.categoryName };
              return { key: "", value: "" };
            })}
          />
          <Select
            onChange={onChangeUnitOfMeasureFilterHandler}
            options={unitOfMeasures.map((p) => {
              return { key: p.unitOfMeasureName, value: p.unitOfMeasureName };
            })}
          />
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', gap: '8px' }}>
            <label style={{ color: theme.palette.textPrimary, fontSize: '14px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} style={{ marginRight: '5px' }} />
              Show Archived
            </label>
          </div>
        </div>
        <div
          className={style.table}
          onClick={(e) => {
            e.stopPropagation();
            setSlectedProduct("");
          }}
        >
          {items.map((product) => (
            <ProductRow
              key={product.id}
              price={product.price}
              width="100%"
              onClick={(e) => {
                e.stopPropagation();
                selectProductHandler(product.id);
              }}
              title={product.title + (product.isArchived ? " (Archived)" : "")}
              media={product.media}
              unitOfMeasure={product.unitOfMeasure.unitOfMeasureName}
              category={product.category.categoryName}
            />
          ))}
        </div>
      </div>
      <div
        // the right side drawer witch have the main to handle the product functionalities
        className={style.info}
        style={{
          backgroundColor: theme.palette.paper,
          boxShadow: "0 2px 8px" + theme.palette.shadow,
        }}
      >
        <Formik
          onSubmit={onSubmitHandler}
          validationSchema={productShcema}
          enableReinitialize
          initialValues={{
            id: selectedItem?.id,
            title: selectedItem?.title,
            category: selectedItem
              ? selectedItem.category.categoryName
              : categories[0]
              ? categories[0].categoryName
              : "",
            unit: selectedItem
              ? selectedItem.unitOfMeasure.unitOfMeasureName
              : unitOfMeasures[0]
              ? unitOfMeasures[0].unitOfMeasureName
              : "",
            price: selectedItem ? selectedItem.price : 0.99,
            sku: selectedItem ? selectedItem.sku || "" : "",
            barcode: selectedItem ? selectedItem.barcode || "" : "",
            reorderLevel: selectedItem ? selectedItem.reorderLevel || 5 : 5,
            costPrice: selectedItem ? selectedItem.costPrice || 0 : 0,
            sellingPrice: selectedItem ? selectedItem.sellingPrice || 0 : 0,
            profitMargin: selectedItem ? selectedItem.profitMargin || 0 : 0,
            image: { preview: selectedItem?.media, img: selectedItem?.media },
          }}
        >
          {({ handleSubmit }) => (
            <Form
              className={style.form}
              style={{ color: theme.palette.textPrimary }}
            >
              <h1>{selectedItem?.id ? "#" + selectedItem.id : "PRODUCT"}</h1>
              {selectedItem?.id && (
                <div style={{ textAlign: "center", marginBottom: "10px" }}>
                  <img src={`/product/${selectedItem.id}/barcode`} alt="Product Barcode" style={{ maxWidth: "100%", height: "auto" }} />
                </div>
              )}
              <ImagePicker name="image" />
              <TextField
                label="Product Name"
                placeholder="Enter Product Name"
                width="100%"
                name="title"
              />
              <TextField
                label="Product Price"
                placeholder="Enter Product Price"
                width="100%"
                type="number"
                name="price"
              />
              <TextField
                label="SKU"
                placeholder="SKU (Auto-generated if blank)"
                width="100%"
                name="sku"
              />
              <TextField
                label="Barcode"
                placeholder="Barcode (Auto-generated if blank)"
                width="100%"
                name="barcode"
              />
              <TextField
                label="Reorder Level"
                placeholder="Reorder Level"
                width="100%"
                type="number"
                name="reorderLevel"
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <TextField
                  label="Cost Price"
                  placeholder="Cost Price"
                  width="100%"
                  type="number"
                  name="costPrice"
                />
                <TextField
                  label="Selling Price"
                  placeholder="Selling Price"
                  width="100%"
                  type="number"
                  name="sellingPrice"
                />
                <TextField
                  label="Profit Margin %"
                  placeholder="Profit Margin %"
                  width="100%"
                  type="number"
                  name="profitMargin"
                />
              </div>
              <TextField
                label="Category"
                placeholder="Enter Category"
                width="100%"
                name="category"
              />
              <TextField
                label="Unit of Measure"
                placeholder="Enter Unit of Measure"
                name="unit"
                width="100%"
              />
              <div className={style.controls}>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    submitAction = "add";
                    handleSubmit();
                  }}
                >
                  ADD
                </Button>
                {selectedProduct && (
                  <>
                    {" "}
                    <Button
                      fullWidth
                      onClick={() => {
                        submitAction = "update";
                        handleSubmit();
                      }}
                      variant="warning"
                    >
                      Update
                    </Button>
                    <Button
                      fullWidth
                      onClick={() => {
                        submitAction = "delete";
                        handleSubmit();
                      }}
                      variant="error"
                    >
                      Delete
                    </Button>
                    {!selectedItem.isArchived ? (
                      <Button
                        fullWidth
                        onClick={() => {
                          submitAction = "archive";
                          handleSubmit();
                        }}
                        variant="secondary"
                      >
                        Archive
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        onClick={() => {
                          submitAction = "restore";
                          handleSubmit();
                        }}
                        variant="primary"
                      >
                        Restore
                      </Button>
                    )}
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

export default ProductPage;
