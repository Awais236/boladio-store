import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="centered-page">
      <div style={{ textAlign: 'center' }}>
        <div className="eyebrow">404</div>
        <h1 style={{ fontSize: 42, margin: '12px 0' }}>Page not found</h1>
        <p className="dim">The page you are looking for doesn't exist.</p>
        <Link to="/" className="btn btn-dark mt-24">Back to Home</Link>
      </div>
    </div>
  );
}