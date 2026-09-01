import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, qs } from '../../lib/api';
import ProductCard from '../../components/ProductCard';
import { ProductGridSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { Ic } from '../../lib/icons';

const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
];

function readInitial(p) {
  return {
    category: p.get('category') || 'all',
    collection: p.get('collection') || '',
    q: p.get('q') || '',
    sort: p.get('sort') || 'featured',
    sizes: (p.get('sizes') || '').split(',').filter(Boolean),
    colors: (p.get('colors') || '').split(',').filter(Boolean),
    fabric: (p.get('fabric') || '').split(',').filter(Boolean),
    availability: p.get('availability') || '',
    minPrice: p.get('minPrice') || '',
    maxPrice: p.get('maxPrice') || '',
    page: p.get('page') || '1',
  };
}

function FilterBlock({ title, children }) {
  return (
    <div className="filter-group">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [f, setF] = useState(() => readInitial(searchParams));
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState({ colors: [], sizes: [], fabrics: [] });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    api('/categories').then((r) => setCats([{ id: 0, name: 'All', slug: 'all' }, ...r.items]));
    api('/products/facets').then(setFacets).catch(() => {});
  }, []);

  const query = useMemo(
    () =>
      qs({
        category: f.category !== 'all' ? f.category : undefined,
        collection: f.collection || undefined,
        q: f.q || undefined,
        sort: f.sort,
        page: f.page,
        limit: 12,
        sizes: f.sizes.join(',') || undefined,
        colors: f.colors.join(',') || undefined,
        fabric: f.fabric.join(',') || undefined,
        availability: f.availability || undefined,
        minPrice: f.minPrice || undefined,
        maxPrice: f.maxPrice || undefined,
      }),
    [f]
  );

  useEffect(() => {
    setLoading(true);
    api(`/products?${query}`)
      .then(setData)
      .catch(() => setData({ items: [], total: 0, pages: 1 }))
      .finally(() => setLoading(false));
  }, [query]);

  const push = (next) => {
    const merged = { ...f, ...next };
    setF(merged);
    setSearchParams(
      qs({
        category: merged.category !== 'all' ? merged.category : undefined,
        collection: merged.collection || undefined,
        q: merged.q || undefined,
        sort: merged.sort !== 'featured' ? merged.sort : undefined,
        sizes: merged.sizes.join(',') || undefined,
        colors: merged.colors.join(',') || undefined,
        fabric: merged.fabric.join(',') || undefined,
        availability: merged.availability || undefined,
        minPrice: merged.minPrice || undefined,
        maxPrice: merged.maxPrice || undefined,
        page: merged.page !== '1' ? merged.page : undefined,
      }),
      { replace: false }
    );
  };

  const toggle = (key, val) => {
    const list = f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val];
    push({ [key]: list, page: '1' });
  };

  const clearAll = () => setSearchParams({});

  const activeCount =
    (f.sizes.length + f.colors.length + f.fabric.length) + (f.availability ? 1 : 0) + (f.minPrice || f.maxPrice ? 1 : 0) + (f.collection ? 1 : 0);

  const isCollectionNew = f.collection === 'new';

  const Filters = (
    <>
      <FilterBlock title="Categories">
        <ul className="filter-list">
          {cats.map((c) => (
            <li key={c.id}>
              <label>
                <input
                  type="radio"
                  name="cat"
                  checked={f.category === c.slug}
                  onChange={() => push({ category: c.slug, page: '1' })}
                />
                {c.name}
              </label>
            </li>
          ))}
        </ul>
        {isCollectionNew && (
          <button className="chip active mt-8" onClick={() => push({ collection: '', page: '1' })}>
            New Arrivals ×
          </button>
        )}
      </FilterBlock>

      <FilterBlock title="Price">
        <div className="range-inputs">
          <input className="input" placeholder="Min" inputMode="numeric" value={f.minPrice} onChange={(e) => push({ minPrice: e.target.value, page: '1' })} />
          <span className="dim small">—</span>
          <input className="input" placeholder="Max" inputMode="numeric" value={f.maxPrice} onChange={(e) => push({ maxPrice: e.target.value, page: '1' })} />
        </div>
      </FilterBlock>

      <FilterBlock title="Size">
        <div className="chip-row">
          {facets.sizes.map((s) => (
            <button key={s} className={`chip ${f.sizes.includes(s) ? 'active' : ''}`} onClick={() => toggle('sizes', s)}>
              {s}
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Color">
        <div className="chip-row">
          {facets.colors.map((c) => (
            <button key={c} className={`chip ${f.colors.includes(c) ? 'active' : ''}`} onClick={() => toggle('colors', c)}>
              {c}
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Fabric">
        <ul className="filter-list">
          {facets.fabrics.map((x) => (
            <li key={x}>
              <label>
                <input type="checkbox" checked={f.fabric.includes(x)} onChange={() => toggle('fabric', x)} />
                {x}
              </label>
            </li>
          ))}
        </ul>
      </FilterBlock>

      <FilterBlock title="Availability">
        <ul className="filter-list">
          {[
            { k: 'in_stock', l: 'In Stock' },
            { k: 'out_of_stock', l: 'Out of Stock' },
            { k: 'on_sale', l: 'On Sale' },
          ].map((o) => (
            <li key={o.k}>
              <label>
                <input
                  type="radio"
                  name="avail"
                  checked={f.availability === o.k}
                  onChange={() => push({ availability: f.availability === o.k ? '' : o.k, page: '1' })}
                />
                {o.l}
              </label>
            </li>
          ))}
        </ul>
      </FilterBlock>

      {activeCount > 0 && (
        <button className="btn btn-ghost btn-sm mt-8" onClick={clearAll}>
          Clear all filters
        </button>
      )}
    </>
  );

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumbs">
            <a href="#" onClick={(e) => e.preventDefault()}>Home</a> / Shop
          </div>
          <h1>{f.category !== 'all' ? cats.find((c) => c.slug === f.category)?.name || 'Shop' : isCollectionNew ? 'New Arrivals' : f.q ? `Search: "${f.q}"` : 'Shop'}</h1>
          <p>{f.category !== 'all' && !isCollectionNew && cats.find((c) => c.slug === f.category)?.tagline}</p>
        </div>
      </div>

      <div className="container shop-layout">
        <aside className="filters-desktop">{Filters}</aside>

        <div>
          <div className="shop-toolbar">
            <span className="shop-results">{loading ? 'Loading…' : `${data.total} item${data.total === 1 ? '' : 's'}`}</span>
            <div className="row">
              <button className="btn btn-outline btn-sm sheet-btn" onClick={() => setSheetOpen(true)}>
                <Ic.Settings width={14} height={14} /> Filter & Sort
              </button>
              <select className="select sort-select" value={f.sort} onChange={(e) => push({ sort: e.target.value, page: '1' })}>
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : data.items.length === 0 ? (
            <EmptyState
              icon="Search"
              title="No matches found"
              text="Try adjusting your filters, or explore our latest collection."
              cta="Explore Collection"
              to="/shop"
            />
          ) : (
            <div className="grid">{data.items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          )}

          {data.pages > 1 && (
            <div className="pager">
              <button disabled={Number(f.page) <= 1} onClick={() => push({ page: String(Number(f.page) - 1) })}>
                Prev
              </button>
              {Array.from({ length: data.pages }).slice(0, 8).map((_, i) => (
                <button key={i} className={Number(f.page) === i + 1 ? 'active' : ''} onClick={() => push({ page: String(i + 1) })}>
                  {i + 1}
                </button>
              ))}
              <button disabled={Number(f.page) >= data.pages} onClick={() => push({ page: String(Number(f.page) + 1) })}>
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`sheet ${sheetOpen ? 'open' : ''}`}>
        <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
        <div className="sheet-panel">
          <div className="sheet-head">
            <h3>Filter & Sort</h3>
            <button className="icon-btn" onClick={() => setSheetOpen(false)}><Ic.X /></button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <select className="select" value={f.sort} onChange={(e) => push({ sort: e.target.value, page: '1' })}>
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          {Filters}
          <button className="btn btn-dark btn-block mt-16" onClick={() => setSheetOpen(false)}>
            Show {data.total} result{data.total === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </>
  );
}