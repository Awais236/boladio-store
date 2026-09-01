export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-card" style={{ border: 'none', boxShadow: 'none' }}>
          <div className="sk" style={{ aspectRatio: '3/4' }} />
          <div style={{ padding: 14 }}>
            <div className="sk" style={{ height: 12, width: '70%', borderRadius: 6 }} />
            <div className="sk mt-8" style={{ height: 14, width: '90%', borderRadius: 6 }} />
            <div className="sk mt-8" style={{ height: 14, width: '40%', borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LineSkeleton({ w = '100%', h = 14 }) {
  return <div className="sk" style={{ height: h, width: w, borderRadius: 6 }} />;
}