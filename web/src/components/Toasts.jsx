import { useToast } from '../context/ToastContext';
import { Ic } from '../lib/icons';

export default function Toasts() {
  const { toasts } = useToast();
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' && <Ic.CheckCircle />}
          {t.type === 'error' && <Ic.Alert />}
          {t.type === 'info' && <Ic.Bell />}
          <p>{t.message}</p>
        </div>
      ))}
    </div>
  );
}