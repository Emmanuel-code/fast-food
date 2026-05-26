import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CartItem } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string, modifications: string) => void;
  updateQty: (menuItemId: string, modifications: string, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'chefs_kitchen_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Clear cart on logout
  useEffect(() => {
    if (!user) {
      // Keep cart across logout so re-login preserves it
    }
  }, [user]);

  const addItem = (newItem: CartItem) => {
    setItems(prev => {
      const existing = prev.find(
        i => i.menu_item_id === newItem.menu_item_id && i.modifications === newItem.modifications
      );
      if (existing) {
        return prev.map(i =>
          i.menu_item_id === newItem.menu_item_id && i.modifications === newItem.modifications
            ? { ...i, qty: i.qty + newItem.qty, price: (i.qty + newItem.qty) * i.unit_price }
            : i
        );
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (menuItemId: string, modifications: string) => {
    setItems(prev => prev.filter(i => !(i.menu_item_id === menuItemId && i.modifications === modifications)));
  };

  const updateQty = (menuItemId: string, modifications: string, qty: number) => {
    if (qty <= 0) {
      removeItem(menuItemId, modifications);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.menu_item_id === menuItemId && i.modifications === modifications
          ? { ...i, qty, price: qty * i.unit_price }
          : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
