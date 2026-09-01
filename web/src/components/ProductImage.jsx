import { useState } from 'react';

export default function ProductImage({ src, alt, className, eager, ...rest }) {
  const [failed, setFailed] = useState(false);
  const url = src && src.startsWith('/') && !failed ? src : src && !failed ? src : '/images/placeholder.svg';

  return (
    <img
      src={failed ? '/images/placeholder.svg' : url}
      alt={alt || ''}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}