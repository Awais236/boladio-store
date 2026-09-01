import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const DataCtx = createContext({});

const defaults = {
  storeOpen: true,
  announcement: null,
  deliveryFee: 250,
  phone: '0123456789',
  whatsapp: '9201234567890',
  address: '7 College Rd, F-7 Markaz, Islamabad, Pakistan',
  storeName: "Boliolo",
};

export function DataProvider({ children }) {
  const [meta, setMeta] = useState(defaults);

  useEffect(() => {
    api('/meta')
      .then(setMeta)
      .catch(() => {});
  }, []);

  const reload = () => api('/meta').then(setMeta).catch(() => {});

  return (
    <DataCtx.Provider value={{ meta, reloadMeta: reload }}>
      {children}
    </DataCtx.Provider>
  );
}

export function useData() {
  return useContext(DataCtx);
}