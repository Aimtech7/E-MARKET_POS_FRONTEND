import { openDB } from 'idb';
import axios from 'axios';

const DB_NAME = 'aim-pos-offline-db';
const STORE_NAME = 'offline-checkouts';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const saveOfflineCheckout = async (checkoutData: any) => {
  const db = await initDB();
  await db.add(STORE_NAME, {
    ...checkoutData,
    timestamp: new Date().toISOString(),
  });
};

export const syncOfflineCheckouts = async (token: string) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const checkouts = await store.getAll();

  if (checkouts.length === 0) return;

  console.log(`Syncing ${checkouts.length} offline checkouts to server...`);

  for (const checkout of checkouts) {
    try {
      // 1. Re-run Cart Save
      const resCart = await axios.post(
        "/cart/check", 
        checkout.cartData,
        { headers: { Authorization: "barear " + token } }
      );
      const dbCartId = resCart.data.cart._id;

      // 2. Re-run Invoice Creation
      const invoicePayload = { ...checkout.invoiceData, cartId: dbCartId };
      const resInvoice = await axios.post(
        "/invoice",
        invoicePayload,
        { headers: { Authorization: "barear " + token } }
      );

      // 3. Re-run Receipt Creation
      const receiptPayload = { ...checkout.receiptData, invoiceId: resInvoice.data.invoice._id };
      await axios.post(
        "/receipt",
        receiptPayload,
        { headers: { Authorization: "barear " + token } }
      );

      // If all succeeded, delete from IDB
      await store.delete(checkout.id);
    } catch (err) {
      console.error(`Failed to sync offline checkout ID: ${checkout.id}`, err);
      // Wait for next sync attempt
    }
  }

  await tx.done;
};

// Listen for connection restoration to trigger sync
export const setupAutoSync = (token: string) => {
  window.addEventListener('online', () => {
    console.log('App is online! Attempting to sync offline data...');
    syncOfflineCheckouts(token);
  });
};
