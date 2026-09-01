import { Link, useLocation } from 'react-router-dom';
import { Ic } from '../../lib/icons';

export default function OrderSuccessPage() {
  const { state } = useLocation();
  const order = state || {};

  return (
    <div className="centered-page">
      <div className="success-card">
        <div className="check-circle">
          <Ic.CheckCircle />
        </div>
        <h1>Order Confirmed 🎉</h1>
        <p className="dim">Thank you for shopping with Boliolo.</p>

        <div className="success-meta">
          <div>
            <div className="k">Order Number</div>
            <div className="v">{order.orderNumber || '—'}</div>
          </div>
          <div>
            <div className="k">Payment</div>
            <div className="v">Cash on Delivery</div>
          </div>
          <div>
            <div className="k">Estimated Delivery</div>
            <div className="v">2–5 business days</div>
          </div>
          <div>
            <div className="k">Status</div>
            <div className="v" style={{ color: 'var(--green)' }}><span className="live-dot" />Pending</div>
          </div>
        </div>

        <p className="dim small" style={{ marginBottom: 22 }}>
          We've received your order. Our team will confirm it shortly — keep an eye on your live
          tracking page for updates.
        </p>

        <div className="success-actions">
          <Link to="/tracking" className="btn btn-dark">
            Track My Order
          </Link>
          <Link to="/shop" className="btn btn-outline">
            <Ic.Arrow width={14} height={14} /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}