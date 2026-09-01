import { statusLabel } from '../../lib/format';

export default function StatusPill({ status, suspicious }) {
  return (
    <>
      <span className={`status-pill st-${status}`}>
        <span className="dot" /> {statusLabel(status)}
      </span>
      {suspicious && <span className="badge-flag">Flagged</span>}
    </>
  );
}