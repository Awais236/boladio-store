import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import ProductImage from '../../components/ProductImage';
import { useToast } from '../../context/ToastContext';
import { Ic } from '../../lib/icons';
import { formatPKR } from '../../lib/format';

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = (filter = stockFilter, query = q) => {
    setLoading(true);
    const filters = { limit: 100 };
    if (filter === 'low') filters.availability = 'in_stock';
    if (filter === 'out') filters.availability = 'out_of_stock';
    if (filter === 'sale') filters.availability = 'on_sale';
    const qs =
      Object.entries(filters)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
    api(`/products?${qs}`)
      .then((r) => {
        const list = r.items.sort((a, b) => b.createdAt - a.createdAt);
        setItems(query ? list.filter((p) => (p.name + ' ' + p.category).toLowerCase().includes(query.toLowerCase())) : list);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api(`/products/${p.id}`, { method: 'DELETE' });
      toast.success('Product deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const FLT = [
    { k: 'all', l: 'All' },
    { k: 'low', l: 'Low Stock' },
    { k: 'out', l: 'Out of Stock' },
    { k: 'sale', l: 'On Sale' },
  ];

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {FLT.map((f) => (
            <button key={f.k} className={`chip ${stockFilter === f.k ? 'active' : ''}`} onClick={() => { setStockFilter(f.k); load(f.k, q); }}>
              {f.l}
            </button>
          ))}
        </div>
        <Link to="/admin/products/new" className="btn btn-dark btn-sm">
          <Ic.Plus width={14} height={14} /> Add Product
        </Link>
      </div>

      <div className="row" style={{ marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 320 }} placeholder="Filter products…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-outline btn-sm" onClick={() => load(stockFilter, q)}><Ic.Search width={14} height={14} /> Filter</button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Sale</th>
              <th>Stock</th>
              <th>Flags</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8}><div className="sk" style={{ height: 60 }} /></td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>No products. Add your first product!</td></tr>}
            {!loading && items.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ width: 34, height: 44 }}>
                    <ProductImage src={p.thumbnail} alt="" style={{ width: 34, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                  </div>
                </td>
                <td><Link to={`/product/${p.slug}`} target="_blank" style={{ fontWeight: 500 }}>{p.name}</Link><br /><span className="dim small">SKU #{p.id}</span></td>
                <td className="small">{p.category}</td>
                <td>{formatPKR(p.price)}</td>
                <td>{p.salePrice ? <span style={{ color: 'var(--red)' }}>{formatPKR(p.salePrice)}</span> : <span className="dim small">—</span>}</td>
                <td>
                  <strong className={p.stock === 0 ? '' : p.stock <= 5 ? 'text-gold' : ''} style={p.stock === 0 ? { color: 'var(--red)' } : undefined}>
                    {p.stock}
                  </strong>
                  {p.stock === 0 && <span className="badge-flag" style={{ marginLeft: 6 }}>Out</span>}
                  {p.stock > 0 && p.stock <= 5 && <span className="badge-flag" style={{ marginLeft: 6, background: 'var(--gold)' }}>Low</span>}
                </td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    {p.isNew && <span className="tag tag-new" style={{ padding: '3px 8px' }}>New</span>}
                    {p.featured && <span className="tag" style={{ padding: '3px 8px', background: 'var(--gold)', color: '#fff' }}>Featured</span>}
                    {!p.active && <span style={{ fontSize: 11, color: 'var(--muted)' }}>hidden</span>}
                  </div>
                </td>
                <td>
                  <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                    <Link to={`/admin/products/${p.id}/edit`} className="icon-btn" style={{ border: '1px solid var(--line)', width: 40, height: 40 }}>
                      <Ic.Edit width={16} height={16} />
                    </Link>
                    <button className="icon-btn" style={{ border: '1px solid var(--line)', width: 40, height: 40, color: 'var(--red)' }} onClick={() => remove(p)}>
                      <Ic.Trash width={16} height={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}