import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  product_id: string;
  store_id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  image: string | null;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  storeId: string | null;
  addItem: (item: CartItem) => { success: boolean; requiresClearConfirm?: boolean };
  forceAddItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,

      addItem: (newItem) => {
        const { items, storeId } = get();

        // If cart is empty, set store_id and add item
        if (items.length === 0) {
          set({
            items: [{ ...newItem, quantity: Math.min(newItem.quantity, newItem.stock) }],
            storeId: newItem.store_id,
          });
          return { success: true };
        }

        // If item belongs to a different store, signal confirmation required
        if (storeId && storeId !== newItem.store_id) {
          return { success: false, requiresClearConfirm: true };
        }

        // Same store, check if item already in cart
        const existingItemIndex = items.findIndex((i) => i.product_id === newItem.product_id);
        if (existingItemIndex > -1) {
          const updatedItems = [...items];
          const existingItem = updatedItems[existingItemIndex];
          const targetQty = existingItem.quantity + newItem.quantity;
          existingItem.quantity = Math.min(targetQty, newItem.stock);
          set({ items: updatedItems });
        } else {
          set({
            items: [...items, { ...newItem, quantity: Math.min(newItem.quantity, newItem.stock) }],
          });
        }

        return { success: true };
      },

      forceAddItem: (newItem) => {
        // Empty existing cart and start fresh for the new store
        set({
          items: [{ ...newItem, quantity: Math.min(newItem.quantity, newItem.stock) }],
          storeId: newItem.store_id,
        });
      },

      removeItem: (productId) => {
        const updatedItems = get().items.filter((item) => item.product_id !== productId);
        set({
          items: updatedItems,
          storeId: updatedItems.length === 0 ? null : get().storeId,
        });
      },

      updateQuantity: (productId, quantity) => {
        const updatedItems = get().items.map((item) => {
          if (item.product_id === productId) {
            return { ...item, quantity: Math.min(Math.max(1, quantity), item.stock) };
          }
          return item;
        });
        set({ items: updatedItems });
      },

      clearCart: () => {
        set({ items: [], storeId: null });
      },

      getTotalItems: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getCartTotal: () => {
        return get().items.reduce((acc, item) => {
          const price = item.sale_price !== null ? item.sale_price : item.price;
          return acc + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: "saba-store-cart",
    }
  )
);
