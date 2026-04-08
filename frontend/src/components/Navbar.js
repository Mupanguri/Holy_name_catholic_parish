import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Programs', to: '/programs' },
  { label: 'Communities', to: '/communities' },
  { label: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isActive = to => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

        /* ── Nav bar ── */
        .hn-nav {
          background: rgba(10, 16, 25, 0.97);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(201,168,76,0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          height: 68px;
          gap: 32px;
          transition: box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .hn-nav.scrolled {
          box-shadow: 0 4px 32px rgba(0,0,0,0.4);
          border-bottom-color: rgba(201,168,76,0.15);
        }

        .hn-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          flex-shrink: 0;
          transition: opacity 0.2s;
        }
        .hn-logo:hover { opacity: 0.88; }

        .hn-logo-img {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          object-fit: cover;
          border: 2px solid rgba(201,168,76,0.25);
          box-shadow: 0 2px 12px rgba(0,0,0,0.35);
          background: rgba(201,168,76,0.06);
        }

        .hn-logo-text { line-height: 1.15; }
        .hn-logo-name {
          display: block;
          font-family: 'Cinzel', serif;
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.04em;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .hn-logo-sub {
          display: block;
          font-family: 'Cinzel', serif;
          font-size: 12px;
          font-weight: 500;
          color: #C9A84C;
          letter-spacing: 0.16em;
          margin-top: 4px;
          text-transform: uppercase;
        }

        /* ── Desktop links ── */
        .hn-links {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          justify-content: center;
        }

        .hn-link {
          position: relative;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          letter-spacing: 0.015em;
          padding: 8px 16px;
          border-radius: 8px;
          transition: color 0.18s ease, background 0.18s ease;
          white-space: nowrap;
          font-family: 'Inter', sans-serif;
        }
        .hn-link:hover {
          color: rgba(255,255,255,0.92);
          background: rgba(255,255,255,0.06);
        }
        .hn-link.active {
          color: #fff;
          background: rgba(201,168,76,0.08);
        }
        .hn-link.active::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 2px;
          border-radius: 2px;
          background: #C9A84C;
        }

        /* ── Right-side CTA buttons ── */
        .hn-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .hn-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.18s ease;
          white-space: nowrap;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          border: none;
          line-height: 1;
        }
        .hn-btn:hover { transform: translateY(-1px); }

        .hn-btn-ghost {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
        }
        .hn-btn-ghost:hover {
          background: rgba(255,255,255,0.09);
          color: #fff;
          border-color: rgba(255,255,255,0.18);
        }

        .hn-btn-gold-outline {
          background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.28);
          color: #C9A84C;
        }
        .hn-btn-gold-outline:hover {
          background: rgba(201,168,76,0.16);
          border-color: rgba(201,168,76,0.45);
        }

        .hn-btn-gold {
          background: #C9A84C;
          border: 1px solid #C9A84C;
          color: #0a0e14;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .hn-btn-gold:hover {
          background: #d4b65c;
          border-color: #d4b65c;
        }

        /* ── Divider between links and CTA ── */
        .hn-divider {
          width: 1px;
          height: 22px;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
          margin: 0 4px;
        }

        /* ── Mobile hamburger ── */
        .hn-hamburger {
          display: none;
          background: none;
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          color: rgba(255,255,255,0.8);
          padding: 8px;
          border-radius: 8px;
          transition: background 0.18s, color 0.18s;
          line-height: 0;
        }
        .hn-hamburger:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }

        /* ── Mobile drawer ── */
        .hn-drawer {
          background: #0a0e14;
          border-top: 1px solid rgba(201,168,76,0.1);
          padding: 12px 16px 20px;
          animation: hn-slide-down 0.22s ease;
        }
        @keyframes hn-slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hn-drawer-links {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 14px;
        }

        .hn-m-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          font-size: 14.5px;
          font-weight: 500;
          padding: 13px 14px;
          border-radius: 9px;
          transition: all 0.18s;
          font-family: 'Inter', sans-serif;
        }
        .hn-m-link:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }
        .hn-m-link.active {
          background: rgba(201,168,76,0.07);
          color: #C9A84C;
        }
        .hn-m-link-arrow {
          opacity: 0.3;
          transition: opacity 0.18s, transform 0.18s;
        }
        .hn-m-link:hover .hn-m-link-arrow,
        .hn-m-link.active .hn-m-link-arrow {
          opacity: 0.7;
          transform: translateX(3px);
        }

        .hn-drawer-cta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .hn-drawer-cta .hn-btn {
          flex: 1;
          min-width: 100px;
          justify-content: center;
        }

        /* ── Responsive breakpoint ── */
        @media (max-width: 900px) {
          .hn-links, .hn-cta, .hn-divider { display: none; }
          .hn-hamburger { display: flex; }
          .hn-nav { padding: 0 20px; gap: 16px; }
        }

        @media (max-width: 540px) {
          .hn-logo-img {
            width: 44px;
            height: 44px;
          }
          .hn-logo-name {
            font-size: 18px;
          }
          .hn-logo-sub {
            font-size: 10px;
            letter-spacing: 0.1em;
          }
        }
      `}</style>

      <nav className={`hn-nav${scrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="hn-logo">
          <img
            src={process.env.PUBLIC_URL + '/images/logo.jpg'}
            alt="Holy Name Church"
            className="hn-logo-img"
          />
          <div className="hn-logo-text">
            <span className="hn-logo-name">Holy Name</span>
            <span className="hn-logo-sub">Catholic Church • Harare</span>
          </div>
        </Link>

        {/* Desktop centre links */}
        <div className="hn-links">
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={label} to={to} className={`hn-link${isActive(to) ? ' active' : ''}`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hn-cta">
          <Link to="/library" className="hn-btn hn-btn-gold-outline">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Library
          </Link>
          <Link to="/posts" className="hn-btn hn-btn-ghost">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            Posts
          </Link>
          <div className="hn-divider" />
          <Link to="/admin/login" className="hn-btn hn-btn-gold">
            Admin
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="hn-hamburger"
          onClick={() => setIsOpen(prev => !prev)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="hn-drawer">
          <div className="hn-drawer-links">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className={`hn-m-link${isActive(to) ? ' active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                {label}
                <svg
                  className="hn-m-link-arrow"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </Link>
            ))}
          </div>
          <div className="hn-drawer-cta">
            <Link
              to="/library"
              className="hn-btn hn-btn-gold-outline"
              onClick={() => setIsOpen(false)}
            >
              Library
            </Link>
            <Link to="/posts" className="hn-btn hn-btn-ghost" onClick={() => setIsOpen(false)}>
              Posts
            </Link>
            <Link to="/admin/login" className="hn-btn hn-btn-gold" onClick={() => setIsOpen(false)}>
              Admin
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
