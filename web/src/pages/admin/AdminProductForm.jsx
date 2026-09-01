import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import ProductImage from '../../components/ProductImage';
import { useToast } from '../../context/ToastContext';
import { Ic } from '../../lib/icons';

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

const emptyForm = {
  name: '',
  categoryId: '',
  shortDesc: '',
  description: '',
  fabric: '',
  fabricCare: '',
  price: '',
  salePrice: '',
  stock: '10',
  sizes: ['S', 'M', 'L'],
  colors: [],
  images: [],
  featured: false,
  isNew: true,
  active: true,
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    api('/categories').then((r) => {
      setCats(r.items);
      if (!isEdit) setForm((f) => ({ ...f, categoryId: r.items[0]?.id || '' }));
    });
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    api(`/products/${id}`)
      .then(({ product: p }) =>
        setForm({
          name: p.name,
          categoryId: p.categoryId || '',
          shortDesc: p.shortDesc || '',
          description: p.description || '',
          fabric: p.fabric || '',
          fabricCare: p.fabricCare || '',
          price: p.price,
          salePrice: p.salePrice || '',
          stock: p.stock,
          sizes: p.sizes,
          colors: p.colors || [],
          images: p.images || [],
          featured: p.featured,
          isNew: p.isNew,
          active: p.active !== false,
        })
      )
      .catch((err) => toast.error(err.message));
  }, [id, isEdit, toast]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setBool = (k) => (e) => setForm({ ...form, [k]: e.target.checked });

  const toggleSize = (s) => {
    setForm({
      ...form,
      sizes: form.sizes.includes(s) ? form.sizes.filter((x) => x !== s) : [...form.sizes, s],
    });
  };

  const toggleColor = (name) => {
    setForm({
      ...form,
      colors: form.colors.some((c) => c.name === name)
        ? form.colors.filter((c) => c.name !== name)
        : [...form.colors, { name, hex: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0') }],
    });
  };

  const uploadImages = async (files) => {
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('images', f));
      const { urls } = await api('/admin/upload', { method: 'POST', body: fd });
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
      toast.success(`${urls.length} image${urls.length === 1 ? '' : 's'} uploaded`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (url) => setForm((f) => ({ ...f, images: f.images.filter((x) => x !== url) }));

  const save = async () => {
    setError('');
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.categoryId) return setError('Select a category.');
    if (!form.price || Number(form.price) <= 0) return setError('Enter a valid price.');
    if (!form.images.length) return setError('Add at least one product image.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        stock: Number(form.stock) || 0,
        featured: Boolean(form.featured),
        isNew: Boolean(form.isNew),
        active: Boolean(form.active),
      };
      if (isEdit) {
        await api(`/products/${id}`, { method: 'PATCH', body: payload });
        toast.success('Product updated');
      } else {
        await api('/products', { method: 'POST', body: payload });
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const PRESET_COLORS = ['Emerald', 'Navy', 'Blush', 'Ivory', 'Black', 'Burgundy', 'Teal', 'Olive', 'Rust', 'Champagne', 'Red', 'Yellow'];

  return (
    <div style={{ maxWidth: 980 }}>
      <div className="row" style={{ marginBottom: 16, gap: 10 }}>
        <Link to="/admin/products" className="btn btn-outline btn-sm"><Ic.Arrow width={13} height={13} style={{ transform: 'rotate(180deg)' }} /> Back</Link>
        <h2 style={{ fontSize: 24 }}>{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="checkout-card">
        <h3 style={{ fontSize: 17 }}>Basics</h3>
        <div className="form-row mt-16">
          <div className="field">
            <label>Product Name *</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="Embroidered Chiffon Suit" />
          </div>
          <div className="field">
            <label>Category *</label>
            <select className="select" value={form.categoryId} onChange={set('categoryId')}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Short Description</label>
          <input className="input" value={form.shortDesc} onChange={set('shortDesc')} />
        </div>
        <div className="field">
          <label>Full Description</label>
          <textarea className="textarea" value={form.description} onChange={set('description')} />
        </div>
        <div className="form-row">
          <div className="field">
            <label>Fabric</label>
            <input className="input" value={form.fabric} onChange={set('fabric')} placeholder="Premium German Chiffon" />
          </div>
          <div className="field">
            <label>Fabric & Care</label>
            <input className="input" value={form.fabricCare} onChange={set('fabricCare')} placeholder="Dry clean only…" />
          </div>
        </div>
      </div>

      <div className="checkout-card">
        <h3 style={{ fontSize: 17 }}>Pricing & Stock</h3>
        <div className="form-row mt-16">
          <div className="field"><label>Price (PKR) *</label><input className="input" type="number" value={form.price} onChange={set('price')} /></div>
          <div className="field"><label>Sale Price (PKR)</label><input className="input" type="number" value={form.salePrice} onChange={set('salePrice')} /></div>
        </div>
        <div className="form-row">
          <div className="field"><label>Stock Quantity</label><input className="input" type="number" value={form.stock} onChange={set('stock')} /></div>
          <div className="field">
            <label>Flags</label>
            <div className="chip-row" style={{ paddingTop: 4 }}>
              <button type="button" className={`chip ${form.featured ? 'active' : ''}`} onClick={() => setForm({ ...form, featured: !form.featured })}>Featured</button>
              <button type="button" className={`chip ${form.isNew ? 'active' : ''}`} onClick={() => setForm({ ...form, isNew: !form.isNew })}>New Arrival</button>
              <button type="button" className={`chip ${!form.active ? 'active' : ''}`} onClick={() => setForm({ ...form, active: !form.active })}>{form.active ? 'Active' : 'Hidden'}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="checkout-card">
        <h3 style={{ fontSize: 17 }}>Sizes</h3>
        <div className="chip-row mt-16">
          {SIZE_OPTIONS.map((s) => (
            <button type="button" key={s} className={`chip ${form.sizes.includes(s) ? 'active' : ''}`} onClick={() => toggleSize(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="checkout-card">
        <h3 style={{ fontSize: 17 }}>Colors</h3>
        <p className="dim small mb-8">Tap to add a colour, tap again to remove.</p>
        <div className="chip-row">
          {PRESET_COLORS.map((c) => (
            <button type="button" key={c} className={`chip ${form.colors.some((x) => x.name === c) ? 'active' : ''}`} onClick={() => toggleColor(c)}>{c}</button>
          ))}
        </div>
        {form.colors.length > 0 && (
          <div className="swatch-row mt-16" style={{ alignItems: 'center' }}>
            {form.colors.map((c) => (
              <span key={c.name} className="popover" style={{ position: 'relative' }}>
                <button type="button" className="swatch active" style={{ background: c.hex }} title={c.name} />
                <small style={{ fontSize: 11, marginLeft: 4 }}>{c.name}</small>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="checkout-card">
        <h3 style={{ fontSize: 17 }}>Images</h3>
        <p className="dim small mb-8">JPG, PNG or WEBP — up to 4MB each. First image is the thumbnail.</p>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => e.target.files?.length && uploadImages(e.target.files)} />
        {uploading && <p className="dim small mt-8">Uploading…</p>}
        <div className="row mt-16" style={{ gap: 12 }}>
          {form.images.map((url) => (
            <div key={url} style={{ position: 'relative' }}>
              <ProductImage src={url} alt="" style={{ width: 84, height: 106, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />
              <button type="button" className="icon-btn" style={{ position: 'absolute', top: -8, right: -8, background: '#fff', border: '1px solid var(--line)', width: 26, height: 26, color: 'var(--red)' }} onClick={() => removeImage(url)}>
                <Ic.X width={13} height={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-dark btn-block btn-xl" onClick={save} disabled={saving || uploading}>
        {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
      </button>
    </div>
  );
}