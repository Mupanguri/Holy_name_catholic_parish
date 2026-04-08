import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const SpecialEvents = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">Special Events Committee</h1>
              <p className="hn-section-sub">Planning and coordinating special celebrations</p>
              {/* Main Committee */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#BA0021] mb-4">Main Committee</h2>
                <ul className="space-y-2 text-lg text-gray-700">
                  <li>
                    <strong>Chair:</strong> Mrs. Michelle T Hombasha
                  </li>
                  <li>
                    <strong>Vice:</strong> Mr. Tapiwa Utete
                  </li>
                  <li>
                    <strong>Special Advisor:</strong> Mrs. Joyce Letitia Kazembe
                  </li>
                  <li>
                    <strong>Secretary:</strong> Mr. Gift Dzingiso
                  </li>
                  <li>
                    <strong>Vice Secretary:</strong> Mrs. Patricia Moyo
                  </li>
                  <li>
                    <strong>Committee Members:</strong>
                    Mr. Christopher Mamhiwa, Mrs. Pauline Manyaya, Mr. Mpakati, Mrs. Tendai L. Doba
                  </li>
                </ul>
              </section>

              {/* About the Committee */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#2C1810] mb-4 text-center">
                  About the Committee
                </h2>
                <p className="text-lg leading-relaxed text-gray-700 mb-4">
                  The Special Events Committee plays a vital role in the parish, responsible for
                  planning and coordinating special celebrations and events that bring the community
                  together. This committee is instrumental in organizing feast celebrations,
                  anniversaries, and other significant events that mark important milestones in the
                  life of the parish.
                </p>
                <p className="text-lg leading-relaxed text-gray-700 mb-4">
                  One of the committee's notable annual traditions is coordinating with the Pope's
                  office to obtain special signed marriage certificates from the Pope for couples
                  celebrating round wedding anniversaries. This thoughtful gesture adds a touching
                  and personal element to the couples' celebrations.
                </p>
                <p className="text-lg leading-relaxed text-gray-700 mb-4">
                  In recent years, the Special Events Committee has successfully organized several
                  high-profile events. In 2017, they spearheaded the parish's 60th-anniversary
                  celebrations, which were a resounding success. More recently, in 2023, they
                  organized a memorable anniversary celebration for Fr. Ndhlalambi, marking a
                  significant milestone in his ministry.
                </p>
                <p className="text-lg leading-relaxed text-gray-700 mb-4">
                  Most recently, the committee organized the activities for the celebration of the
                  Holy Name Feast Day, held on February 2, 2025. This event brought the parish
                  community together to honor the Holy Name of Jesus and to reflect on the parish's
                  patronage.
                </p>
                <p className="text-lg leading-relaxed text-gray-700">
                  Through their hard work and dedication, the Special Events Committee continues to
                  create lasting memories for the parish community, fostering a sense of unity, joy,
                  and celebration.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default SpecialEvents;
