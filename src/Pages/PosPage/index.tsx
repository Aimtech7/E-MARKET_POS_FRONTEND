import React, { FC, useEffect } from "react";
import ProductList from "../../Components/ProductList";
import Aside from "../../Components/Aside";
import axios from "axios";
import { set_categories, set_products, set_units } from "../../store/Actions";
import { useDispatch } from "react-redux";
import { useCookies } from "react-cookie";
import { useHardwareScanner } from "../../utils/useHardwareScanner";

/**
 * ## POS Page
 * POS Page is the main page of the system witch allow the user to handle the carts/orders.
 * It allow to add or delete products from the carts or even continue the payment.
 * ```ts
 * type Cart = {// order
 * cartId: uuid() //universal unique identifier
 * description: string,
 * tax: double,
 * discount: double,
 * products: Product[]
 * }
 * ```
 */
const PosPage: FC = () => {
  const dispatch = useDispatch();
  const [cookies] = useCookies(["auth"]);
  useHardwareScanner(); // Mount hardware scanning hook

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in inputs or textareas, unless it's an override like F9
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === 'F9') {
        e.preventDefault();
        const btn = document.querySelector('.checkoutBtn') as HTMLButtonElement;
        if (btn) btn.click();
      } else if (e.key === 'Escape' && !isInput) {
        e.preventDefault();
        const holdBtn = document.querySelector('.holdCartBtn') as HTMLButtonElement;
        if (holdBtn) holdBtn.click();
      } else if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        const holdBtn = document.querySelector('.holdCartBtn') as HTMLButtonElement;
        if (holdBtn) holdBtn.click();
      } else if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.searchFieldInput') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:5500/category/categories", {
        headers: { Authorization: "Bearer " + cookies.auth?.token }
      })
      .then((res) => dispatch(set_categories(res.data)))
      .catch((err) => {
        alert(err.response?.data?.message || err.message);
      });
    axios
      .get("http://localhost:5500/product/products", {
        headers: { Authorization: "Bearer " + cookies.auth?.token }
      })
      .then((res) => dispatch(set_products(res.data)))
      .catch((err) => {
        alert(err.response?.data?.message || err.message);
      });
    axios
      .get("http://localhost:5500/unit/units", {
        headers: { Authorization: "Bearer " + cookies.auth?.token }
      })
      .then((res) => dispatch(set_units(res.data)))
      .catch((err) => {
        alert(err.response?.data?.message || err.message);
      });
  }, [dispatch, cookies.auth?.token]);
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div style={{ flex: '1 1 60%', height: '100%' }}>
        <ProductList />
      </div>
      <div style={{ flex: '1 1 40%', height: '100%' }}>
        <Aside />
      </div>
    </div>
  );
};

export default PosPage;
