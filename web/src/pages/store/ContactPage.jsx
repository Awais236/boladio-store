import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { Ic } from '../../lib/icons';
import { WHATSAPP } from '../../lib/format';

export default function ContactPage() {
  const { meta } = useData();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await api('/contact', { method: 'POST', body: form });
      toast.success('Message sent — we will get back to you shortly.');
      setForm({ name: '', phone: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const wa = WHATSAPP('Hello Boliolo! I have a question.');

  return (
    <>
      <div className="page-head">
        <div className="crumbs">Home / Contact</div>
        <h1>Contact Us</h1>
        <p>We'd love to hear from you — questions, styling help or orders.</p>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        <div className="contact-cards">
          <div className="contact-card">
            <div className="ic"><Ic.Phone /></div>
            <h4>Call Now</h4>
            <p>{meta.phone}</p>
            <a href="tel:0123456789" className="btn btn-dark btn-sm">Call Now</a>
          </div>
          <div className="contact-card">
            <div className="ic"><Ic.Pin /></div>
            <h4>Visit the Boutique</h4>
            <p>Block ABC, Street ABC<br />House Number 123, Islamabad</p>
            <a
              className="btn btn-outline btn-sm"
              href="https://www.google.com/maps/search/?api=1&query=Block+ABC+Street+ABC+House+Number+123+Islamabad"
              target="_blank"
              rel="noreferrer"
            >
              Get Directions
            </a>
          </div>
          <div className="contact-card">
            <div className="ic"><Ic.WhatsApp /></div>
            <h4>WhatsApp</h4>
            <p>Fastest way to reach us</p>
            <a className="btn btn-ghost btn-sm" href={wa} target="_blank" rel="noreferrer">
              Chat on WhatsApp
            </a>
          </div>
        </div>

        <div className="split" style={{ gap: 30 }}>
          <div>
            <div className="eyebrow">Send a Message</div>
            <h2 style={{ fontSize: 'clamp(24px,3vw,32px)', margin: '10px 0 8px' }}>We usually reply within an hour</h2>
            <p className="dim">Order inquiries, size help, custom orders and more.</p>
          </div>
          <form onSubmit={submit} className="checkout-card" style={{ margin: 0 }}>
            {error && <div className="form-error">{error}</div>}
            <div className="form-row">
              <div className="field">
                <label>Your Name</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Mobile</label>
                <input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03xx xxxxxxx" />
              </div>
            </div>
            <div className="field">
              <label>Message</label>
              <textarea className="textarea" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <button className="btn btn-dark btn-block" disabled={sending}>
              {sending ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}