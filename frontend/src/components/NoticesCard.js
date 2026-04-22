import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const formatDate = d => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isPast = d => d && new Date(d) < new Date();
const isSoon = d => {
  if (!d) return false;
  const diff = new Date(d) - new Date();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
};

export default function NoticesCard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsAPI
      .getBulletins()
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const bulletins = items.filter(p => p.is_bulletin || p.is_pinned);
  const events = items.filter(p => !p.is_bulletin && !p.is_pinned);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
        Loading notices…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
        No notices at this time.
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: bulletins.length > 0 && events.length > 0 ? '1fr 1fr' : '1fr',
      gap: 40,
    }}
      className="notices-grid"
    >
      <style>{`
        @media (max-width: 768px) { .notices-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ── Bulletins column ── */}
      {bulletins.length > 0 && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          }}>
            <div style={{ width: 4, height: 22, background: '#C9A84C', borderRadius: 2, flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 600,
              color: '#1B3A6B', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Bulletins
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {bulletins.map(item => (
              <Link key={item.id} to={`/posts/${item.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  borderBottom: '1px solid rgba(27,58,107,0.08)',
                  paddingBottom: 14,
                  transition: 'opacity 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {item.is_pinned && (
                    <span style={{
                      fontSize: 10, color: '#C9A84C', fontWeight: 700,
                      letterSpacing: '0.1em', display: 'block', marginBottom: 4,
                    }}>
                      PINNED
                    </span>
                  )}
                  <div style={{ color: '#1B3A6B', fontSize: 15, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>
                    {item.title}
                  </div>
                  {item.excerpt && (
                    <div style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
                      {item.excerpt.length > 100 ? item.excerpt.substring(0, 100) + '…' : item.excerpt}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {item.event_date && (
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>{formatDate(item.event_date)}</span>
                    )}
                    {item.pdf_url && (
                      <span
                        onClick={e => { e.preventDefault(); window.open(`${API}${item.pdf_url}`, '_blank'); }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          color: '#1B3A6B', fontSize: 12, fontWeight: 600,
                          borderBottom: '1px solid rgba(27,58,107,0.3)', cursor: 'pointer',
                        }}
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        Download PDF
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Events column ── */}
      {events.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 4, height: 22, background: '#1B3A6B', borderRadius: 2, flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 600,
              color: '#1B3A6B', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Upcoming Events
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map(item => {
              const past = isPast(item.event_date);
              const soon = isSoon(item.event_date);
              return (
                <Link key={item.id} to={`/posts/${item.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                    borderBottom: '1px solid rgba(27,58,107,0.08)',
                    paddingBottom: 12, opacity: past ? 0.45 : 1,
                    transition: 'opacity 0.15s',
                  }}
                    onMouseEnter={e => { if (!past) e.currentTarget.style.opacity = '0.7'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = past ? '0.45' : '1'; }}
                  >
                    {item.event_date && (
                      <div style={{
                        flexShrink: 0, width: 44, textAlign: 'center',
                        background: soon ? '#1B3A6B' : 'rgba(27,58,107,0.06)',
                        borderRadius: 8, padding: '6px 4px',
                      }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: soon ? '#fff' : '#1B3A6B', lineHeight: 1 }}>
                          {new Date(item.event_date).getDate()}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: soon ? 'rgba(255,255,255,0.7)' : '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 2 }}>
                          {new Date(item.event_date).toLocaleDateString('en-GB', { month: 'short' })}
                        </div>
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      {soon && (
                        <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, display: 'block', marginBottom: 2, letterSpacing: '0.06em' }}>
                          HAPPENING SOON
                        </span>
                      )}
                      <div style={{ color: past ? '#9ca3af' : '#1B3A6B', fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                        {item.title}
                      </div>
                      {item.category && (
                        <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{item.category}</div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
