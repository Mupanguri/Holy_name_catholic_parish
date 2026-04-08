import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const MoyoMusandeGuild = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">The Sacred Heart of Jesus Christ – Youth Guild</h1>
              <p className="hn-section-sub">Moyo Musande</p>
              {/* Executive Table */}
              <section className="mb-6">
                <h2 className="text-2xl font-semibold text-[#2C1810] mb-4 bg-amber-100 p-3 rounded-t-lg">
                  Executive Members
                </h2>
                <table className="w-full bg-white rounded-b-lg text-left border border-amber-200">
                  <thead>
                    <tr className="bg-[#1B3A6B] text-white">
                      <th className="p-3 font-semibold">Role</th>
                      <th className="p-3 font-semibold">Name</th>
                    </tr>
                  </thead>
                  <tbody className="text-lg text-gray-700">
                    <tr>
                      <td className="p-3">Chairperson</td>
                      <td className="p-3">Arthur Hukama</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3">Vice Chairperson</td>
                      <td className="p-3">Kelvin Kapfunde</td>
                    </tr>
                    <tr>
                      <td className="p-3">Secretary</td>
                      <td className="p-3">Natasha Gurure</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3">Vice Secretary</td>
                      <td className="p-3">Seltina Gore</td>
                    </tr>
                    <tr>
                      <td className="p-3">Financial Secretary</td>
                      <td className="p-3">Evidence Chitongo</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3">Vice Financial Secretary</td>
                      <td className="p-3">Tanaka Mukosoro</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default MoyoMusandeGuild;
