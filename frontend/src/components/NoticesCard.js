import React, { useState, useEffect, useRef } from 'react';
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
  const scrollRef = useRef(null);

  useEffect(() => {
    postsAPI
      .getBulletins()
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const bulletins = items.filter(p => p.is_bulletin || p.is_pinned);
  const events = items.filter(p => !p.is_bulletin && !p.is_pinned);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(27,58,107,0.08)',
        border: '1px solid rgba(27,58,107,0.08)',
        minHeight: 420,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #0f1923 0%, #1B3A6B 100%)',
        borderBottom: '3px solid #C9A84C'
      }}>
        <h3 style={{
          fontFamily: "'Cinzel', serif",
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          margin: 0,
          letterSpacing: '0.04em'
        }}>
          Parish Notices & Events
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '4px 0 0' }}>
          Bulletins, Upcoming Events, Announcements
        </p>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 16, height: 16, border: '2px solid #e5e7eb', borderTopColor: '#1B3A6B',
              borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
            Loading notices...
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      ) : items.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
          No notices at this time.
        </div>
      ) : (
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {/* Pinned Bulletins */}
          {bulletins.map(item => (
            <Link key={item.id} to={`/posts/${item.id}`} style={{ display: 'block', textDecoration: 'none' }}>
              <div
                style={{
                  margin: '8px 16px',
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderLeft: '4px solid #C9A84C',
                  borderRadius: 12,
                  padding: '14px 18px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(201,168,76,0.1)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(201,168,76,0.06)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {item.is_pinned && (
                    <span style={{ fontSize: 10, color: '#C9A84C', fontWeight: 600, letterSpacing: '0.05em' }}>PINNED</span>
                  )}
                  <span style={{
                    background: '#C9A84C', color: '#0f1923', fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase'
                  }}>
                    BULLETIN
                  </span>
                </div>
                <div style={{ color: '#1B3A6B', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                {item.excerpt && (
                  <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>
                    {item.excerpt.substring(0, 90)}{item.excerpt.length > 90 ? '...' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                  {item.pdf_url && (
                    <span
                      onClick={e => { e.preventDefault(); window.open(`${API}${item.pdf_url}`, '_blank'); }}
                      style={{
                        background: 'rgba(27,58,107,0.08)', border: '1px solid rgba(27,58,107,0.15)',
                        color: '#1B3A6B', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Download PDF
                    </span>
                  )}
                  {item.event_date && (
                    <span style={{ color: '#9ca3af', fontSize: 11 }}>{formatDate(item.event_date)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {/* Divider */}
          {bulletins.length > 0 && events.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 20px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(27,58,107,0.08)' }} />
              <span style={{ color: '#9ca3af', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600 }}>UPCOMING</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(27,58,107,0.08)' }} />
            </div>
          )}

          {/* Events */}
          {events.map(item => {
            const past = isPast(item.event_date);
            const soon = isSoon(item.event_date);
            return (
              <Link key={item.id} to={`/posts/${item.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div
                  style={{
                    margin: '6px 16px',
                    background: past ? 'rgba(0,0,0,0.02)' : '#fff',
                    border: '1px solid rgba(27,58,107,0.06)',
                    borderLeft: soon ? '3px solid #22c55e' : '3px solid rgba(27,58,107,0.1)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    opacity: past ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(27,58,107,0.03)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = past ? 'rgba(0,0,0,0.02)' : '#fff'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      {soon && (
                        <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, display: 'block', marginBottom: 4 }}>HAPPENING SOON</span>
                      )}
                      <div style={{ color: past ? '#9ca3af' : '#1B3A6B', fontSize: 14, fontWeight: 600 }}>{item.title}</div>
                      <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>{item.category}</div>
                    </div>
                    {item.event_date && (
                      <div style={{ flexShrink: 0, textAlign: 'right', color: past ? '#d1d5db' : '#6b7280', fontSize: 11 }}>
                        {formatDate(item.event_date)}
                        {past && <div style={{ fontSize: 10, color: '#d1d5db' }}>Past</div>}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(27,58,107,0.06)', textAlign: 'center' }}>
        <Link to="/posts" style={{ color: '#1B3A6B', fontSize: 12, textDecoration: 'none', fontWeight: 600, letterSpacing: '0.02em' }}>
          View all posts
        </Link>
      </div>
    </div>
  );
}