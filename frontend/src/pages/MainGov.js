import React from 'react';
import ComingSoon from '../components/ComingSoon';

const MainGov = () => {
  return (
    <div className="hn-parchment-page">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="hn-parchment-container">
          <div className="hn-parchment-bar"></div>
          <div className="relative p-6">
            <ComingSoon title="Main Governing Committee" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainGov;
