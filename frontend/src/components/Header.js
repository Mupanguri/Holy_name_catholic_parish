import React from 'react';
import Navbar from './Navbar';

export default function Header() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

        .hdr-root {
          position: sticky;
          top: 0;
          z-index: 1000;
          width: 100%;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .hdr-announce {
          background: linear-gradient(90deg, #0a0e14 0%, #151d28 50%, #0a0e14 100%);
          border-bottom: 1px solid rgba(201,168,76,0.15);
          padding: 10px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          overflow: hidden;
          position: relative;
        }

        .hdr-announce::before,
        .hdr-announce::after {
          content: '';
          display: block;
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent);
          flex-shrink: 0;
        }

        .hdr-announce-text {
          font-family: 'Cinzel', serif;
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.25em;
          color: #C9A84C;
          text-transform: uppercase;
          white-space: nowrap;
        }

        @media (max-width: 640px) {
          .hdr-announce-text {
            font-size: 9.5px;
            letter-spacing: 0.14em;
          }
          .hdr-announce::before,
          .hdr-announce::after {
            width: 20px;
          }
        }
      `}</style>

      <header className="hdr-root">
        <div className="hdr-announce">
          <span className="hdr-announce-text">Our Eyes Have Seen Your Salvation</span>
        </div>
        <Navbar />
      </header>
    </>
  );
}
