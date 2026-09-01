import { createContext, useContext, useEffect, useReducer, useMemo, useCallback, useState } from 'react';
import { useToast } from './ToastContext';

const CartCtx = createContext(null);
const KEY = 'nf_cart_v1';

const keyOf = (i) => `${i.productId}|${i.size || ''}|${i.colorName || ''}`;

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const k = keyOf(action.item);
      const existing = state.find((i) => keyOf(i) === k);
      if (existing) {
        return state.map((i) =>
          keyOf(i) === k ? { ...i, qty: Math.min(i.qty + action.item.qty, action.item.stock || 99) } : i
        );
      }
      return [...state, action.item];
    }
    case 'setQty': {
      return state.map((i) =>
        keyOf(i) === action.key
          ? { ...i, qty: Math.max(1, Math.min(action.qty, i.stock || 99)) }
          : i
      );
    }
    case 'remove':
      return state.filter((i) => keyOf(i) !== action.key);
    case 'clear':
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, load);
  const [open, setOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback(
    (item) => {
      dispatch({ type: 'add', item });
      toast.success('Added to your cart');
    },
    [toast]
  );

  const setQty = useCallback((key, qty) => dispatch({ type: 'setQty', key, qty }), []);
  const remove = useCallback((key) => dispatch({ type: 'remove', key }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.qty * Number(i.price), 0);
    return { items, count, subtotal, add, setQty, remove, clear, open, setOpen };
  }, [items, add, setQty, remove, clear, open]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  return useContext(CartCtx);
}