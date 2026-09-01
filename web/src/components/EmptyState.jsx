import { Link } from 'react-router-dom';
import { Ic } from '../lib/icons';

export default function EmptyState({ icon = 'Box', title, text, cta, to, action }) {
  const Icon = Ic[icon] || Ic.Box;
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {to && (
        <Link to={to} className="btn btn-dark">
          {cta || 'Explore Collection'}
        </Link>
      )}
      {action && (
        <button className="btn btn-dark" onClick={action}>
          {cta}
        </button>
      )}
    </div>
  );
}