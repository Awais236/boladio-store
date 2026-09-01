import { useData } from '../context/DataContext';
import { Ic } from '../lib/icons';

export default function WhatsAppFloat() {
  const { meta } = useData();
  const msg = "Hello Boliolo! I'd like to place an order.";
  return (
    <a
      className="wa-float"
      href={`https://wa.me/${meta.whatsapp}?text=${encodeURIComponent(msg)}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <Ic.WhatsApp />
    </a>
  );
}