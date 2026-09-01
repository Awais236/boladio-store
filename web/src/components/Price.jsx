import { formatPKR } from '../lib/format';

export default function Price({ price, salePrice, size = 'md', className = '' }) {
  const onSale = salePrice && Number(salePrice) < Number(price);
  const pct = onSale ? Math.round(((price - salePrice) / price) * 100) : 0;

  if (size === 'lg') {
    return (
      <div className={`pd-price ${className}`}>
        <span>{formatPKR(onSale ? salePrice : price)}</span>
        {onSale && <span className="was">{formatPKR(price)}</span>}
        {onSale && <span className="save">Save {pct}%</span>}
      </div>
    );
  }

  return (
    <div className={`pc-price ${className}`}>
      <span className="now">{formatPKR(onSale ? salePrice : price)}</span>
      {onSale && <span className="was">{formatPKR(price)}</span>}
    </div>
  );
}