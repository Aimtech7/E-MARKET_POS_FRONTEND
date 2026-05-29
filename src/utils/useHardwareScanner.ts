import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/Reducers";
import { addProductToCart } from "../store/Actions";
import useSnackbar from "../context/Snackbar/useSnackbar";

export const useHardwareScanner = () => {
  const dispatch = useDispatch();
  const snackbar = useSnackbar();

  const cartId = useSelector<RootState>((state) => state.selectedCartReducer) as string;
  const products = useSelector<RootState>((state) => state.productsReducer) as Product[];

  // Ref-based state to keep references stable inside window listener
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  // Stable references for Redux state
  const cartIdRef = useRef<string>(cartId);
  const productsRef = useRef<Product[]>(products);

  useEffect(() => {
    cartIdRef.current = cartId;
    productsRef.current = products;
  }, [cartId, products]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in standard inputs or textareas to avoid interference
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Enter key marks the end of a barcode scan
      if (e.key === "Enter") {
        const barcode = bufferRef.current.trim();
        if (barcode.length > 0) {
          // Hardware scanners are fast; let's verify if the input was simulated or manual.
          // Optional safety: only process if the characters came in fast.
          // However, some cashiers might actually want slow manual keyboard mockups for testing,
          // so let's allow it but still require a quick sequence if possible, or just accept the buffer.
          const foundProduct = productsRef.current.find(
            (p) => p.barcode === barcode || p.sku === barcode
          );

          if (foundProduct) {
            let targetCartId = cartIdRef.current;
            if (!targetCartId) {
              targetCartId = Date.now().toString();
              dispatch({ type: "CREATE_CART", data: { cartId: targetCartId, products: [], description: "", tax: 0, discount: 0 } });
              dispatch({ type: "CHOOSE_CART", data: targetCartId });
            }
            dispatch(addProductToCart(targetCartId, foundProduct));
            snackbar.onResponse({
              message: `Added "${foundProduct.title}" to cart.`,
              status: 200,
            });
            try {
              const audio = new Audio('/beep.mp3');
              audio.play().catch(e => console.log('Audio error:', e));
            } catch (e) {}
          } else {
            snackbar.onResponse({
              message: `Scanned code "${barcode}" not matching any product SKU/barcode.`,
              status: 404,
            });
          }
          bufferRef.current = "";
        }
        return;
      }

      // Buffer printable characters only
      if (e.key.length === 1) {
        // If keystroke gap is large (e.g. > 100ms), it's probably manual slow typing.
        // We reset the buffer and start capturing a new sequence.
        if (timeDiff > 100 && bufferRef.current.length > 0) {
          bufferRef.current = "";
        }
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch, snackbar]);
};
