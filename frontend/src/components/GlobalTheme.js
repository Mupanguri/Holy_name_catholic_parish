import React from 'react';

const GlobalTheme = ({ children }) => {
  return (
    <>
      <style>{`
        /* ── Fonts ── */
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        
        :root {
          --parish-blue: #1B3A6B;
          --parish-blue-dark: #0f2444;
          --parish-gold: #C9A84C;
          --parish-gold-light: #e8d9a8;
          --parchment: #FAF8F5;
          --parchment-dark: #F0EDE6;
          --text-primary: #1a1a1a;
          --text-muted: #6b7280;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Cinzel', serif;
        }

        /* ═══════════════════════════════════════ */
        /* PARCHMENT BACKGROUND - Applied Globally */
        /* ═══════════════════════════════════════ */
        
        .hn-parchment-page {
          background: var(--parchment);
          min-height: 100vh;
        }
        
        .hn-parchment-container {
          background: #fff;
          border-radius: 16px;
          box-shadow: 
            0 1px 3px rgba(0,0,0,0.04),
            0 4px 20px rgba(27,58,107,0.06);
          border: 1px solid rgba(27,58,107,0.08);
          overflow: hidden;
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        
        .hn-parchment-container:hover {
          box-shadow: 
            0 2px 8px rgba(0,0,0,0.06),
            0 8px 32px rgba(27,58,107,0.1);
        }
        
        .hn-parchment-bar {
          height: 3px;
          width: 100%;
          background: linear-gradient(90deg, var(--parish-blue) 0%, var(--parish-gold) 100%);
        }
        
        /* ── Section Headings ── */
        .hn-section-heading {
          font-family: 'Cinzel', serif;
          font-size: clamp(24px, 4vw, 36px);
          font-weight: 600;
          text-align: center;
          letter-spacing: 0.02em;
          margin-bottom: 12px;
          color: var(--parish-blue);
        }

        .hn-section-sub {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 400;
          letter-spacing: 0.03em;
          text-align: center;
          color: var(--text-muted);
          margin-bottom: 32px;
        }

        /* ── Decorative Rule with Cross ── */
        .hn-section-rule {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 48px;
        }
        .hn-rule-line {
          height: 1px;
          width: 60px;
          background: linear-gradient(90deg, transparent, var(--parish-gold));
        }
        .hn-rule-line.rev {
          background: linear-gradient(90deg, var(--parish-gold), transparent);
        }
        .hn-rule-cross {
          color: var(--parish-gold);
          font-size: 12px;
          opacity: 0.9;
        }

        /* ── Stay Connected Section ── */
        .hn-connected { 
          background: linear-gradient(180deg, var(--parchment) 0%, var(--parchment-dark) 100%);
          padding: 80px 0; 
        }

        /* ── Card Base ── */
        .hn-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 
            0 1px 2px rgba(0,0,0,0.04),
            0 4px 16px rgba(27,58,107,0.06);
          border: 1px solid rgba(27,58,107,0.06);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hn-card:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 4px 12px rgba(0,0,0,0.08),
            0 16px 40px rgba(27,58,107,0.12);
        }

        /* ── Card Headers ── */
        .hn-card-header {
          padding: 20px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .hn-card-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: inherit;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .hn-card:hover .hn-card-header::before {
          opacity: 0.1;
        }
        
        .hn-card-header h3 {
          font-family: 'Cinzel', serif;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          position: relative;
          z-index: 1;
        }

        .hn-card-header-blue {
          background: linear-gradient(135deg, #0f1923 0%, var(--parish-blue) 100%);
        }
        .hn-card-header-gold {
          background: linear-gradient(135deg, var(--parish-blue) 0%, #2a5490 50%, var(--parish-gold) 100%);
        }
        .hn-card-header-red {
          background: linear-gradient(135deg, var(--parish-blue) 0%, #5c2626 50%, #8B2332 100%);
        }

        /* ── Mass Times Items ── */
        .hn-mass-item {
          border-left: 3px solid var(--parish-gold);
          padding-left: 16px;
          margin-bottom: 20px;
          transition: border-color 0.2s ease;
        }
        .hn-mass-item:hover {
          border-left-color: var(--parish-blue);
        }
        .hn-mass-item h4 {
          font-family: 'Cinzel', serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--parish-blue);
          margin-bottom: 6px;
          letter-spacing: 0.03em;
        }

        /* ── Post Category Pill ── */
        .hn-post-pill {
          display: inline-block;
          padding: 4px 12px;
          font-size: 10px;
          font-weight: 600;
          color: var(--parish-blue);
          background: rgba(27,58,107,0.08);
          border-radius: 20px;
          margin-bottom: 10px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }
        
        .hn-post-pill:hover {
          background: var(--parish-blue);
          color: #fff;
        }

        /* ── View All Button ── */
        .hn-view-all {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: var(--parish-blue);
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(27,58,107,0.2);
        }
        .hn-view-all:hover { 
          background: var(--parish-blue-dark);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(27,58,107,0.3);
        }
        .hn-view-all:active {
          transform: translateY(0);
        }

        /* ── Primary Button ── */
        .hn-btn-primary {
          width: 100%;
          background: var(--parish-blue);
          color: #fff;
          padding: 14px 24px;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: block; 
          text-align: center; 
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(27,58,107,0.15);
        }
        .hn-btn-primary:hover { 
          background: var(--parish-blue-dark);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(27,58,107,0.25);
        }

        /* ── Outline Button ── */
        .hn-btn-outline {
          width: 100%;
          background: transparent;
          color: var(--parish-blue);
          padding: 13px 24px;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          border: 2px solid rgba(27,58,107,0.2);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: block; 
          text-align: center; 
          text-decoration: none;
        }
        .hn-btn-outline:hover { 
          background: var(--parish-blue); 
          color: #fff;
          border-color: var(--parish-blue);
        }

        /* ── Post Card ── */
        .hn-post-card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.06);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hn-post-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(27,58,107,0.12);
        }
        .hn-post-card img {
          transition: transform 0.4s ease;
        }
        .hn-post-card:hover img {
          transform: scale(1.05);
        }

        /* ── Info Card (Adoration style) ── */
        .hn-info-card {
          background: var(--parchment);
          border: 1px solid rgba(27,58,107,0.08);
          padding: 16px;
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        .hn-info-card:hover {
          background: rgba(27,58,107,0.04);
        }
        .hn-info-card h4 {
          font-family: 'Cinzel', serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--parish-blue);
          margin-bottom: 6px;
          letter-spacing: 0.03em;
        }
      `}</style>

      {children ? <div className="hn-parchment-page">{children}</div> : null}
    </>
  );
};

export default GlobalTheme;