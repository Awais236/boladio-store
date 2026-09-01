export default function Modal({ onClose, title, children, wide }) {
  return (
    <div className="modal open" role="dialog" aria-modal>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel" style={wide ? { maxWidth: 900 } : undefined}>
        <button className="icon-btn modal-close" onClick={onClose} aria-label="Close">
          <Ic.X />
        </button>
        {title && (
          <div style={{ padding: '22px 26px 0' }}>
            <h3 style={{ fontSize: 22 }}>{title}</h3>
          </div>
        )}
        <div style={{ padding: title ? '14px 26px 26px' : '22px 26px 26px' }}>{children}</div>
      </div>
    </div>
  );
}

import { Ic } from '../lib/icons';