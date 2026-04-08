import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const About = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">About Us</h1>
              <p className="hn-section-sub">Holy Name Catholic Church - Mabelreign</p>
              <section className="font-sans">
                {/* Clickable Email */}
                <div className="text-center mb-8">
                  <p className="text-lg font-semibold mb-2">Send us an email:</p>
                  <a
                    href="mailto:catholicchurchholyname@gmail.com"
                    className="text-2xl font-bold text-[#BA0021] underline hover:text-[#85001A] transition-colors"
                  >
                    catholicchurchholyname@gmail.com
                  </a>
                </div>

                {/* Scripture Quote */}
                <div className="bg-white/60 py-6 px-4 rounded-lg text-center border border-amber-200">
                  <p className="text-lg font-serif text-[#2C1810]">
                    We continue to give back all Glory to the HOLY TRINITY for seeing us through
                    these great years in our endeavours to deepen our relationship with the LORD
                    through living life guided by the HOLY SPIRIT - John 14:26
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default About;
