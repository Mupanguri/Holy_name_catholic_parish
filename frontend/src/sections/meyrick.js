import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const MeyrickParkSection = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">Meyrick Park Section</h1>
              <p className="hn-section-sub">A community under Holy Name Parish</p>
              {/* Section Content */}
              <section className="rounded-lg shadow-lg mt-6">
                <h2 className="p-4 text-blue-parish text-xl font-medium uppercase">
                  Meyrick Park Section
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed mb-4">
                  Meyrick Park section consists of 4 small Christian community groups, each based on
                  street locations.
                </p>

                <div className="space-y-4">
                  {/* Aims and Objectives */}
                  <h3 className="text-xl font-semibold text-blue-parish">Aims and Objectives</h3>
                  <ul className="list-disc pl-6 space-y-3 text-gray-700">
                    <li>Encourage oneness through prayer and Bible readings.</li>
                    <li>Visit the sick in their homes or hospitals.</li>
                    <li>Support and participate actively in all parish activities.</li>
                  </ul>

                  {/* Leadership */}
                  <h3 className="text-xl font-semibold text-blue-parish">Leadership</h3>
                  <ul className="list-disc pl-6 space-y-3 text-gray-700">
                    <li>Chairperson: Mrs. Thoko Nyandoro</li>
                    <li>Youth Coordinator: Clarence</li>
                    <li>Secretary: Hilda</li>
                    <li>Treasurer: Takura Hombasha</li>
                    <li>Liturgist: Tawanda Tigere</li>
                  </ul>

                  {/* Community Groups */}
                  <h3 className="text-xl font-semibold text-blue-parish">Community Groups</h3>
                  <ul className="list-disc pl-6 space-y-3 text-gray-700">
                    <li>St Cecelia (between Sherwood, Wessex, and Clavering Road).</li>
                    <li>St Benedict (between Latchmore Road and Lachlan Roads).</li>
                    <li>St Andrews (between Horseferry, Sherwood, and Richwell Road).</li>
                    <li>
                      St Dominics (Hillmorton, Notley, Anzac, Wanganui, and part of Richwell).
                    </li>
                  </ul>

                  {/* Achievements */}
                  <h3 className="text-xl font-semibold text-blue-parish">Achievements</h3>
                  <ul className="list-disc pl-6 space-y-3 text-gray-700">
                    <li>2023 Winner of Bible Quiz Competition</li>
                    <li>2023-2024 Domestic Choir Competitions: 1st Position</li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default MeyrickParkSection;
