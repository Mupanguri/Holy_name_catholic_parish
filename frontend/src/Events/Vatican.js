import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const VaticanPage = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <section className="mb-8">
                <h2 className="hn-section-heading">To Vatican With Love Pilgrimage</h2>
                <p className="hn-section-sub">A special journey of faith</p>
                <p className="text-lg text-gray-700 leading-relaxed mt-4">
                  Special committee formulated to organize the upcoming pilgrimage. It comprises
                  members from the Ministry of Matrimony and Fellow Parishioners.
                </p>
              </section>
              <p className="text-xl text-gray-800 font-semibold mb-4 text-center">
                We are preparing something special for you!
              </p>
              <p className="text-lg text-gray-600 italic text-center mb-6">
                Information to be shared soon. Stay tuned!
              </p>
              <div className="mt-6 text-center">
                <div className="bg-[#1B3A6B] text-white text-lg py-2 px-6 rounded-full inline-block shadow-lg hover:bg-[#0f2444] transition-colors cursor-pointer">
                  Stay Tuned
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default VaticanPage;
