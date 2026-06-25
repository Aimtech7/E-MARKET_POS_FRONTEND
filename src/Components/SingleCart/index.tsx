import {
  faArrowDown,
  faArrowRight,
  faArrowUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { ChangeEvent, FC, useState } from "react";
import style from "./style.module.css";
import useTheme from "../../context/Theme/useTheme";
import SearchField from "../SearchField";
import Row from "./Components/Row";
import Button from "../Button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/Reducers";
import { Formik, Form } from "formik";
import {
  addProductToCart,
  checkCart,
  deleteCartProduct,
  updateCart,
  updateCartProduct,
} from "../../store/Actions";
import Input from "../Input";
import axios from "axios";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import ReceiptModal from "../ReceiptModal";
import { useCookies } from "react-cookie";

const headings = [
  { key: "id", title: "product" },
  { key: "qty", title: "QTY" },
  { key: "price", title: "price" },
];

interface props {
  onClick?: () => void;
  orderId: string;
  onRemoveOrder: () => void;
}
type Selected = {
  key: string;
  status: "descending" | "ascending" | "";
};
const SingleCart: FC<props> = ({ onClick, orderId, onRemoveOrder }) => {
  const [selectedColumn, setSelectedColumn] = useState<Selected>({
    key: "",
    status: "",
  });
  const [searchValue, setSearchValue] = useState<string>("");
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cookies] = useCookies();

  const dispatch = useDispatch();
  const theme = useTheme();
  const snackbar = useSnackbar();
  let cart = (
    useSelector<RootState>((state) => state.cartsReducer) as Cart[]
  ).find((p) => p.cartId === orderId) as Cart;
  
  const productsReducer = useSelector<RootState>((state) => state.productsReducer) as Product[];

  if(!cart){
    cart = {description:'', products:[], tax:0, discount:0, cartId:''}
  }

  let items = cart ? [...cart.products] : [];
  const qtyChangeHandler = (value: string, id: string) => {
    let val = value === "" ? "1" : value;
    // logic to change the quantity for this product in the cart
    dispatch(updateCartProduct(orderId, id, { qty: parseInt(val) }));
  };
  const descriptionChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    // logic to change the description for this product in the cart
    dispatch(updateCart(orderId, { description: event.target.value }));
  };
  const onDeleteProduct = (id: string) => {
    dispatch(deleteCartProduct(orderId, id));
  };
  const updateDiscount = (event: ChangeEvent<HTMLInputElement>) => {
    let val = event.target.value === "" ? "0" : event.target.value;
    dispatch(
      updateCart(orderId, {
        discount: parseInt(val) / 100,
      })
    );
  };
  const updateTax = (event: ChangeEvent<HTMLInputElement>) => {
    let val = event.target.value === "" ? "0" : event.target.value;
    dispatch(updateCart(orderId, { tax: parseInt(val) / 100 }));
  };
  const onSearchHandler = (value: string) => {
    setSearchValue(value);
  };
  
  const handleSearchCustomer = async () => {
    if (!customerSearch) return;
    try {
      const res = await axios.get(`/customer/search?query=${customerSearch}`, {
        headers: { Authorization: "barear " + cookies.auth?.token }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleAttachCustomer = (cust: any) => {
    dispatch(updateCart(orderId, { customerId: cust._id, customerName: cust.name }));
    setSearchResults([]);
    setCustomerSearch("");
  };
  const filterHandler = (id: string) => {
    if (selectedColumn.key === id && selectedColumn.status === "ascending") {
      // logic to sort the items descending ; becouse the previous status is ascending
      // set the status to descending
      setSelectedColumn({
        key: id,
        status: "descending",
      });
    } else if (
      selectedColumn.key === id &&
      selectedColumn.status === "descending"
    ) {
      // logic to back the items order as the default
      // set the status to ""
      setSelectedColumn({
        key: "",
        status: "",
      });
    } else {
      // logic to sort the items ascending
      // set the status to ascending
      setSelectedColumn({
        key: id,
        status: "ascending",
      });
    }
  };
  if (selectedColumn.status === "ascending") {
    if (selectedColumn.key === "price") {
      items.sort((prev: any, curr: any) => {
        if (
          prev[selectedColumn.key] * prev["qty"] <
          curr[selectedColumn.key] * curr["qty"]
        )
          return -1;
        else if (prev[selectedColumn.key] > curr[selectedColumn.key]) return 1;
        return 0;
      });
    } else {
      items.sort((prev: any, curr: any) => {
        if (prev[selectedColumn.key] < curr[selectedColumn.key]) return -1;
        else if (prev[selectedColumn.key] > curr[selectedColumn.key]) return 1;
        return 0;
      });
    }
  } else if (selectedColumn.status === "descending") {
    if (selectedColumn.key === "price") {
      items.sort((prev: any, curr: any) => {
        if (
          prev[selectedColumn.key] * prev["qty"] >
          curr[selectedColumn.key] * curr["qty"]
        )
          return -1;
        else if (prev[selectedColumn.key] < curr[selectedColumn.key]) return 1;
        return 0;
      });
    } else {
      items.sort((prev: any, curr: any) => {
        if (prev[selectedColumn.key] > curr[selectedColumn.key]) return -1;
        else if (prev[selectedColumn.key] < curr[selectedColumn.key]) return 1;
        return 0;
      });
    }
  } else {
    items = cart ? cart.products : [];
  }
  items = items.filter((p) => p.title.startsWith(searchValue));
  let totalPrice = 0;
  for (let val of items) {
    totalPrice += val.qty * val.price;
  }
  if (cart) totalPrice += -totalPrice * cart.discount + totalPrice * cart.tax;

  return (
    <div className={style.single}>
      <div className={style.orderHead}>
        <h1 style={{ color: theme.palette.textPrimary }}>Order : #{orderId}</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button variant="danger" onClick={() => dispatch(updateCart(orderId, { products: [] }))} className="clearCartBtn">Clear</Button>
          <Button variant="warning" onClick={onClick} className="holdCartBtn">Hold Cart</Button>
          <FontAwesomeIcon
            className={style.arrowRight}
            icon={faArrowRight}
            color={theme.palette.textPrimary}
            cursor={"pointer"}
            onClick={onClick}
          />
        </div>
      </div>
      <Formik
        onSubmit={() => {
          setIsReceiptOpen(true);
        }}
        initialValues={{ description: cart? cart.description : ""}}
      >
        <Form
          style={{
            width: "95%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "1em",
            height: 'calc(100vh - 100px)',
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <SearchField
              width="50%"
              color="#66666622"
              onChange={onSearchHandler}
            />
            <Input
              name="barcodeManual"
              width="50%"
              placeholder="Manual Barcode..."
              onChange={(e: any) => {
                if(e.target.value.length > 5) {
                   const found = productsReducer.find(p => p.barcode === e.target.value || p.sku === e.target.value);
                   if (found) {
                     dispatch(addProductToCart(orderId, found));
                     snackbar.onResponse({ message: `Added ${found.title}`, status: 200 });
                     e.target.value = "";
                   }
                }
              }}
            />
          </div>
          <Input
            name="description"
            value={cart ? cart.description:''}
            onChange={descriptionChangeHandler}
            width="100%"
          />
          
          <div style={{ padding: '10px', background: theme.palette.paper, borderRadius: '8px' }}>
            <p style={{ color: theme.palette.textPrimary, margin: '0 0 5px 0' }}>
              Customer: {cart?.customerName || "Walk-in"}
              {cart?.customerName && (
                <span style={{ color: 'red', marginLeft: '10px', cursor: 'pointer' }} onClick={() => dispatch(updateCart(orderId, { customerId: undefined, customerName: undefined }))}>Remove</span>
              )}
            </p>
            {!cart?.customerName && (
              <div style={{ display: 'flex', gap: '5px' }}>
                <Input
                  width="100%"
                  value={customerSearch}
                  onChange={(e: any) => setCustomerSearch(e.target.value)}
                  name="customerSearch"
                  placeholder="Search Phone or Name"
                />
                <Button onClick={handleSearchCustomer} variant="primary" type="button">Search</Button>
              </div>
            )}
            {searchResults.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {searchResults.map((cust) => (
                  <div key={cust._id} style={{ display: 'flex', justifyContent: 'space-between', color: theme.palette.textPrimary, background: '#222', padding: '5px' }}>
                    <span>{cust.name} - {cust.phone}</span>
                    <button type="button" onClick={() => handleAttachCustomer(cust)}>Attach</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={style.table} style={{ flexGrow: 1, minHeight: 0 }}>
            <div className={style.head}>
              {headings.map((item) => (
                <div
                  className={style.heading}
                  key={item.key}
                  onClick={() => filterHandler(item.key)}
                >
                  <p style={{ color: theme.palette.textPrimary }}>
                    {item.title}
                  </p>
                  {selectedColumn.key === item.key &&
                    selectedColumn.status === "ascending" && (
                      <FontAwesomeIcon
                        fontSize={14}
                        color={theme.palette.textSecondary}
                        icon={faArrowDown}
                      />
                    )}
                  {selectedColumn.key === item.key &&
                    selectedColumn.status === "descending" && (
                      <FontAwesomeIcon
                        fontSize={14}
                        color={theme.palette.textSecondary}
                        icon={faArrowUp}
                      />
                    )}
                </div>
              ))}
            </div>
            {items.map((item) => (
              <Row
                key={item.id}
                unitOfMeasure={item.unitOfMeasure.unitOfMeasureName}
                onDelete={onDeleteProduct}
                onQTYChange={qtyChangeHandler}
                id={item.id}
                title={item.title}
                media={item.media}
                price={item.price}
                qty={item.qty}
              />
            ))}
          </div>
          <div
            className={style.orderData}
            style={{ color: theme.palette.textPrimary }}
          >
            <div className={style.totalsSection}>
              <div className={style.row}>
                <p>Discount</p>
                <div className={style.rowValue}>
                  <p>-%{(cart.discount * 100).toFixed(2)}</p>
                  <Input
                    onChange={updateDiscount}
                    width="8em"
                    type="number"
                    value={(cart.discount * 100).toFixed(0)}
                  />
                </div>
              </div>
              <div className={style.row}>
                <p>Tax</p>
                <div className={style.rowValue}>
                  <p>+%{(cart.tax * 100).toFixed(2)}</p>
                  <Input
                    onChange={updateTax}
                    width="8em"
                    type="number"
                    value={(cart.tax * 100).toFixed(0)}
                  />
                </div>
              </div>
              <div className={`${style.row} ${style.grandTotal}`}>
                <p>Total</p>
                <p>Ksh {totalPrice.toFixed(2)}</p>
              </div>
            </div>
            <Button type="submit" variant="success" size="large" fullWidth className={`${style.checkoutBtn} checkoutBtn`}>
              CHECKOUT
            </Button>
          </div>
        </Form>
      </Formik>
      <ReceiptModal
        cart={cart}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onSuccess={() => {
          onRemoveOrder();
          dispatch(checkCart(orderId));
        }}
      />
    </div>
  );
};
export default SingleCart;
