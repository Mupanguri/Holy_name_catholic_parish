import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const ChoirShona = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">Shona Choir</h1>
              <p className="hn-section-sub">Learn about our history, mission, goals</p>
              <div className="bg-gradient-to-r from-[#1B3A6B] to-[#BA0021] text-white p-6 rounded-lg shadow-md text-center">
                <h2 className="text-3xl font-semibold mb-2">More Information to Come</h2>
                <p className="text-md">We're working hard to bring you more! Stay tuned!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default ChoirShona;
