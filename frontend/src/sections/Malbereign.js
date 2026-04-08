import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const MabelreignCentralSection = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">Mabelreign Central Section</h1>
              <p className="hn-section-sub">A community under Holy Name Parish</p>
              {/* Section Content */}
              <section className="p-4 rounded-lg shadow-lg mt-6">
                <h2 className="p-4 text-blue-parish text-xl font-medium uppercase">
                  Mabelreign Central Section
                </h2>
                <p className="mb-4">
                  Established in 1985, Mabelreign Central Section ("MC") began its journey as a
                  prayer group under the leadership of Mrs. Gilbertha Rimbi, sister to the then
                  parish priest, Fr. Gilbert Mordecai. For a year, all meetings, focused on the
                  Rosary, were hosted at Mrs. Rimbi's home. The founding members included remarkable
                  women like Mrs. Marimba (Vice Chair), Mrs. Gwanzura (Treasurer), and others whose
                  contributions laid the foundation for this vibrant section.
                </p>
                <p className="mb-4">
                  Initially, meetings were separate for men and women, but by the early 1990s, the
                  section evolved into a combined family unit. Activities like praying the Rosary,
                  singing, and practicing Shona hymns helped foster unity and spiritual growth
                  within the group.
                </p>

                <h3 className="text-xl font-semibold mb-2">Growth and Community</h3>
                <p className="mb-4">
                  Over the years, membership has grown to 30 families, with 22 actively
                  participating. The section introduced cherished traditions, such as Christmas "Get
                  Together" parties, where Mr. Richard Makwiramiti played the beloved role of
                  'Father Christmas.' These gatherings strengthened the bond among members and
                  created lasting memories.
                </p>

                <h3 className="text-xl font-semibold mb-2">Activities and Challenges</h3>
                <p className="mb-4">
                  Mabelreign Central Section actively participates in parish events, including works
                  of mercy, choir competitions, and Bible quizzes. Although the section has faced
                  challenges in singing competitions, primarily due to its elderly membership, it
                  continues to be a pillar of the community, fostering faith and fellowship.
                </p>
                <p className="mb-4">
                  In 1987, the section introduced member subscriptions, which helped sustain its
                  activities and support church initiatives. The section remains a testament to
                  dedication, tradition, and the enduring spirit of its founding members.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default MabelreignCentralSection;
