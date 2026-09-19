import React from 'react';

export default function LoadingSkeleton({ count = 4, type = 'card' }) {
  if (type === 'card') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '24px',
          width: '100%',
        }}
      >
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            style={{
              background: '#f1f5f9',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'pulse 1.5s infinite ease-in-out',
            }}
          >
            <div style={{ width: '100%', height: '180px', background: '#e2e8f0' }} />
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ height: '18px', width: '70%', background: '#cbd5e1', borderRadius: '4px' }} />
              <div style={{ height: '14px', width: '40%', background: '#e2e8f0', borderRadius: '4px' }} />
              <div style={{ height: '22px', width: '30%', background: '#cbd5e1', borderRadius: '4px', marginTop: '6px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            height: '40px',
            width: '100%',
            background: '#e2e8f0',
            borderRadius: '8px',
            animation: 'pulse 1.5s infinite ease-in-out',
          }}
        />
      ))}
    </div>
  );
}
