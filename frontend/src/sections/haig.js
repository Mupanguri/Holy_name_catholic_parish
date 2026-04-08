import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const HaigParkSection = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">Haig Park Section</h1>
              <p className="hn-section-sub">A community under Holy Name Parish</p>
              {/* Haig Park Section */}
              <div className="p-4 rounded-lg shadow-lg mt-6">
                <h2 className="p-4 bg-blue-parish text-white text-xl font-medium uppercase">
                  Haig Park Section
                </h2>

                <h3 className="text-[#BA0021] text-xl font-semibold mb-2 text-center">
                  Introduction
                </h3>
                <p className="mb-4 text-center">
                  Haig Park Section, one of the smallest in the parish, remains vibrant and active
                  in parish activities. Initially a Small Christian Community, it was combined with
                  Meyrick Park Section but later split in the 1990s due to growth. Despite a
                  decrease in numbers, the section currently has 18 active families.
                </p>

                <h3 className="text-[#BA0021] text-xl font-semibold mb-2 text-center">
                  Past Section Leaders
                </h3>
                <table className="table-auto w-full mb-4 text-center">
                  <thead>
                    <tr className="p-4 text-blue-parish text-xl font-medium uppercase">
                      <th className="py-2 px-4">Leader Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-4">Mrs. Kanyorwa</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4">Mrs. Chigumba</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4">Mrs. Dzimati</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4">Mrs. Gwatidzo</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4">Mrs. Chikova</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4">Mrs. Chandisarewa</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4">Mr. Mugwara</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4">Mrs. Mahenga (Present)</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="text-[#BA0021] text-xl font-semibold mb-2 text-center">
                  Life of the Section
                </h3>
                <p className="mb-4 text-center">
                  Haig Park Section has fostered a close-knit community through events like Father's
                  Day braais, Christmas parties, and acts of mercy such as visiting children's
                  homes, donating clothing and food, and offering school fees assistance. The
                  section also supports baptisms, confirmations, and weddings for its members.
                </p>

                <h3 className="text-[#BA0021] text-xl font-semibold mb-2 text-center">
                  Participation in Parish
                </h3>
                <p className="mb-4 text-center">
                  Haig Park Section is actively involved in all parish activities, with members
                  representing the section in various committees, guilds, and associations,
                  including Readers, Ministers of Eucharist, Holy Childhood, and Fundraising.
                </p>

                <h3 className="text-[#BA0021] text-xl font-semibold mb-2 text-center">
                  Parish Leadership, Service & Achievements
                </h3>
                <ul className="list-disc list-inside mb-4 text-center">
                  <li>Mr. Mhuka serves as the Vice Parish Council Chairperson.</li>
                  <li>
                    Around 1980, Mrs. Watungwa and Mrs. Chidaguro were the first Catechists at Haig
                    Park School, teaching both Catholic and non-Catholic children.
                  </li>
                  <li>Mrs. Chipenda chaired Chita chaMariya Hosi Yedenga (1993–1994).</li>
                  <li>
                    Mr. Alois Mutero has been a long-serving Catechist and Marriage Counselor.
                  </li>
                  <li>Krystall Mabika became the youngest coordinator for the English Lectors.</li>
                  <li>
                    Mr. Andrew Mutandwa, now in the diaspora, initiated the parish HIV/AIDS
                    Committee.
                  </li>
                  <li>The section won first place in the 2012 Bible Quiz Competitions.</li>
                </ul>

                <h3 className="text-[#BA0021] text-xl font-semibold mb-2 text-center">Memoriam</h3>
                <p className="mb-4 text-center">
                  The section honors deceased members, including Mrs. Ngorima, Mrs. Gwatidzo, and
                  others. May their souls rest in eternal peace.
                </p>

                <h3 className="text-[#BA0021] text-xl font-semibold mb-2 text-center">
                  Conclusion
                </h3>
                <p className="text-center">
                  As one family, Haig Park Section continues to worship together and contribute to
                  the parish, striving for the greater glory of God.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default HaigParkSection;
