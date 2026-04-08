import React from 'react';
import GlobalTheme from '../GlobalTheme';

/**
 * ParchmentPage Template
 * Use for: Full content pages with parchment styling (About, Committees, Guilds, etc.)
 * Features: Parchment background, decorative bar, section headings
 */
export const ParchmentPage = ({ children }) => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">{children}</div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default ParchmentPage;
