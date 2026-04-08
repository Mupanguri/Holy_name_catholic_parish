import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const CotswoldHillsSection = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">Cotswold Hills Section</h1>
              <p className="hn-section-sub">A community under Holy Name Parish</p>
              {/* Section Content */}
              <section className="p-4 rounded-lg shadow-lg mt-6">
                <h2 className="p-4 text-blue-parish text-xl font-medium uppercase">
                  Cotswold Hills Section
                </h2>
                <p className="mb-4">
                  Cotswold Hills Section is a thriving community with 64 families, including 40
                  active members. The section comprises five small Christian communities: St.
                  Catherine, St. Bernadette, St. Peter Claver, St. Francis of Assisi, and St. John
                  Baptist.
                </p>
                <p className="mb-4">
                  Being home to the parish itself, many members have the privilege of attending
                  daily Mass. In the past, the section was twinned with Ashdown Park, collaborating
                  on events like funerals and weddings.
                </p>

                <h3 className="text-xl font-semibold mb-2">Key Contributions</h3>
                <ul className="list-disc list-inside mb-4">
                  <li>Introduced section uniforms.</li>
                  <li>Won the Parish Domestic Choir Competition six times.</li>
                  <li>Contributed 18 Mass Servers, including three pioneer girl servers.</li>
                  <li>Trained children in playing hosho, with Sandra Makumbirofa as a pioneer.</li>
                </ul>

                <p className="mb-4">
                  The section is proud to support a member, Caswell Chinyerere Machivenyika, in his
                  priesthood journey at the Jesuit School of Theology in Kenya. Cotswold Hills
                  continues to build a strong, supportive community dedicated to spiritual growth.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default CotswoldHillsSection;
