import { Ic } from '../lib/icons';

export default function QuantityPicker({ value, onChange, max = 99 }) {
  const dec = () => onChange(Math.max(1, value - 1));
  const inc = () => onChange(Math.min(max || 99, value + 1));
  return (
    <div className="qty-row">
      <button className="qty-btn" onClick={dec} disabled={value <= 1} aria-label="Decrease">
        <Ic.Minus width={16} height={16} />
      </button>
      <span className="qty-val">{value}</span>
      <button className="qty-btn" onClick={inc} disabled={value >= (max || 99)} aria-label="Increase">
        <Ic.Plus width={16} height={16} />
      </button>
    </div>
  );
}