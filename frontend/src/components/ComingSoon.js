import React from 'react';
import { Link } from 'react-router-dom';
import GlobalTheme from './GlobalTheme';

const ComingSoon = ({ title = 'Coming Soon', message }) => {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px 20px',
      }}
    >
      <div style={{ textAlign: 'center', width: '100%', maxWidth: '560px' }}>
        {/* ── Custom message if provided ── */}
        {message && (
          <div
            style={{
              marginBottom: '20px',
              padding: '15px 20px',
              background: 'rgba(139,105,20,0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(139,105,20,0.3)',
              color: '#6b4a1e',
              fontSize: '14px',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            {message}
          </div>
        )}

        {/* ── Construction Banner ── */}
        <div
          style={{
            background:
              'linear-gradient(135deg, #0f1923 0%, #1B3A6B 38%, #6b4e12 68%, #C9A84C 100%)',
            borderRadius: '14px',
            padding: '44px 36px 36px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,168,76,0.25)',
            border: '1px solid rgba(201,168,76,0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Diagonal construction stripe overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(201,168,76,0.05) 20px, rgba(201,168,76,0.05) 22px)',
              pointerEvents: 'none',
            }}
          />

          {/* Construction icons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '14px',
              marginBottom: '22px',
              fontSize: '30px',
              position: 'relative',
            }}
          >
            <span>🦺</span>
            <span>🏗️</span>
            <span>🔧</span>
            <span>⚙️</span>
            <span>👷</span>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '26px',
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              position: 'relative',
              textShadow: '0 2px 16px rgba(0,0,0,0.5)',
            }}
          >
            More Information to Come
          </h2>

          {/* Subtitle */}
          <p
            style={{
              color: 'rgba(255,255,255,0.72)',
              fontSize: '14px',
              letterSpacing: '0.03em',
              marginBottom: '24px',
              position: 'relative',
            }}
          >
            We're working hard to bring you more — stay tuned!
          </p>

          {/* Gold cross divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              position: 'relative',
            }}
          >
            <div style={{ height: '1px', width: '70px', background: 'rgba(201,168,76,0.55)' }} />
            <span style={{ color: '#C9A84C', fontSize: '20px' }}>✝</span>
            <div style={{ height: '1px', width: '70px', background: 'rgba(201,168,76,0.55)' }} />
          </div>
        </div>

        {/* ── Redirect block ── */}
        <div
          style={{
            background: 'rgba(255,255,255,0.55)',
            borderRadius: '10px',
            padding: '20px 24px',
            marginTop: '28px',
            textAlign: 'left',
          }}
        >
          <p
            style={{ fontWeight: '600', color: '#1B3A6B', marginBottom: '12px', fontSize: '14px' }}
          >
            In the meantime:
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <li style={{ fontSize: '14px', color: '#555' }}>
              📅 Check our{' '}
              <Link to="/programs" style={{ color: '#1B3A6B', textDecoration: 'underline' }}>
                Programs
              </Link>{' '}
              page for upcoming events
            </li>
            <li style={{ fontSize: '14px', color: '#555' }}>
              📰 Visit the{' '}
              <Link to="/posts" style={{ color: '#1B3A6B', textDecoration: 'underline' }}>
                Posts
              </Link>{' '}
              section for the latest news
            </li>
            <li style={{ fontSize: '14px', color: '#555' }}>
              📸 Browse our{' '}
              <Link to="/gallery" style={{ color: '#1B3A6B', textDecoration: 'underline' }}>
                Gallery
              </Link>
            </li>
          </ul>
        </div>

        {/* ── Motto ── */}
        <p style={{ marginTop: '24px', fontSize: '13px', color: '#aaa', fontStyle: 'italic' }}>
          "Our Eyes Have Seen Your Salvation"
        </p>
      </div>
    </div>
  );

  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">{content}</div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default ComingSoon;
