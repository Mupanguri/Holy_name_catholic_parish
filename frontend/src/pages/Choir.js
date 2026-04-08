import React from 'react';
import { ParchmentPage } from '../components/templates';

const EnglishChoir = () => {
  return (
    <ParchmentPage>
      <h1 className="hn-section-heading">Holy Name Mabelreign English Choir</h1>
      <p className="hn-section-sub">Bringing vibrancy to the English Mass</p>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-[#2C1810]">Introduction</h2>
        <p className="text-base leading-relaxed text-gray-700">
          Singing is a vital part of liturgy, enhancing worship and uplifting the congregation. The
          English Choir at Holy Name Mabelreign has played a key role in bringing vibrancy to the
          English Mass, fostering active participation and praise.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-[#2C1810]">History</h2>
        <p className="text-base leading-relaxed text-gray-700">
          Established in the early 1980s, the choir has undergone significant changes, from the
          early days of organ music to the integration of guitars and youth participation. Notable
          leaders and musicians, such as Mrs. Nyahasha and Mr. Chichi, have shaped its growth,
          making the choir a vital part of parish life.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-[#2C1810]">Achievements</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li>Recorded and released a CD in 2014 under the leadership of Mrs. Stella Muza.</li>
          <li>Compiled a local hymn book with 25 copies for choir members.</li>
          <li>Prepared for a second CD recording in collaboration with St. John's High School.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-[#2C1810]">Membership Dynamics</h2>
        <p className="text-base leading-relaxed text-gray-700">
          The English Choir has around 30 active members, with a fluid membership as individuals
          join or leave. Youth involvement remains a focus, with notable young talents actively
          participating.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-[#2C1810]">Collaboration</h2>
        <p className="text-base leading-relaxed text-gray-700">
          The choir collaborates with the Shona Choir for combined Masses and community events, such
          as weddings and interdenominational services during Christmas and Easter. They also host
          an annual Christmas carol service.
        </p>
      </section>
    </ParchmentPage>
  );
};

export default EnglishChoir;
