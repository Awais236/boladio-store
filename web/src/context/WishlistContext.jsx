import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useToast } from './ToastContext';

const WishCtx = createContext(null);
const KEY = 'nf_wishlist_v1';

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState([]);
  const toast = useToast();

  useEffect(() => {
    try {
      setIds(JSON.parse(localStorage.getItem(KEY) || '[]'));
    } catch {
      setIds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids]);

  const toggle = useCallback(
    (id) => {
      setIds((prev) => {
        const has = prev.includes(id);
        toast[has ? 'info' : 'success'](has ? 'Removed from wishlist' : 'Saved to wishlist');
        return has ? prev.filter((x) => x !== id) : [...prev, id];
      });
    },
    [toast]
  );

  const has = useCallback((id) => ids.includes(id), [ids]);

  const value = useMemo(() => ({ ids, toggle, has, count: ids.length }), [ids, toggle, has]);
  return <WishCtx.Provider value={value}>{children}</WishCtx.Provider>;
}

export function useWishlist() {
  return useContext(WishCtx);
}