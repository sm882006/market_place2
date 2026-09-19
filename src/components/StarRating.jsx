import React, { useState } from 'react';

export default function StarRating({
  value = 5,
  onChange = null,
  count = null,
  size = '1rem',
  showNumber = true,
}) {
  const [hoverValue, setHoverValue] = useState(null);
  const isInteractive = typeof onChange === 'function';

  const stars = [1, 2, 3, 4, 5];
  const activeRating = hoverValue !== null ? hoverValue : value;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: size,
        color: '#f59e0b',
        userSelect: 'none',
      }}
    >
      {stars.map((star) => (
        <span
          key={star}
          style={{
            cursor: isInteractive ? 'pointer' : 'default',
            transition: 'transform 0.1s ease',
            transform: isInteractive && hoverValue === star ? 'scale(1.2)' : 'scale(1)',
          }}
          onMouseEnter={() => isInteractive && setHoverValue(star)}
          onMouseLeave={() => isInteractive && setHoverValue(null)}
          onClick={() => isInteractive && onChange(star)}
        >
          {star <= activeRating ? '★' : '☆'}
        </span>
      ))}
      {showNumber && (
        <span style={{ fontSize: '0.85em', fontWeight: 600, color: '#475569', marginLeft: '4px' }}>
          {Number(value).toFixed(1)}
          {count !== null && <span style={{ fontWeight: 400, color: '#94a3b8' }}> ({count})</span>}
        </span>
      )}
    </div>
  );
}
