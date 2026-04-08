import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const Chemwoyo = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">MOST SACRED HEART OF JESUS GUILD</h1>
              <p className="hn-section-sub">Chita Chemwoyo Musande Kwazvo Wayesu</p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                The Sacred Heart of Jesus Guild is a Catholic organization that brings together
                Catholic faithful to spread the love of God everywhere. The Sacred Heart of Jesus
                devotion was introduced by Jesus Christ Himself to various saints after He had
                revealed Himself to them. Jesus Christ entrusted the mission of spreading the
                devotion to Margaret Mary Alacoque. Margaret Mary was born on 22 July 1647 and died
                on 17 October 1690. The Sacred Heart of Jesus Guild is a family guild consisting of
                fathers, mothers, and children who wish to join. Any person with a good heart, who
                has received the sacraments and is approved by the spiritual director, can join the
                guild. The objectives of the Sacred Heart of Jesus Guild are:
              </p>

              {/* List of Objectives */}
              <ul className="list-disc list-inside space-y-4 text-gray-700 text-lg mb-6">
                <li>To give love and devotion to Jesus through devotion to His Sacred Heart</li>
                <li>
                  To return love for the love shown to us by Jesus Christ who was pierced for our
                  transgressions, and His heart was wounded by a lance
                </li>
                <li>To spread the love of God;</li>
                <li>To atone for our sins and those of all people</li>
              </ul>

              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Major Feast Days celebrated by the Guild
              </p>

              {/* List of Special Days */}
              <ul className="list-disc list-inside space-y-4 text-gray-700 text-lg mb-6">
                <li>
                  <strong>Sacred Heart Day:</strong> Celebrated on the Friday after the Feast of the
                  Body and Blood of Christ, Corpus Christi. The Holy Name Parish celebrates this
                  day.
                </li>
                <li>
                  <strong>Margaret Mary Day:</strong> Celebrated by all members on 16 October every
                  year.
                </li>
                <li>
                  <strong>Christ the King Day:</strong> Celebrated on the last Sunday of November
                  every year.
                </li>
                <li>
                  <strong>Corpus Christi:</strong> A major feast of the Body and Blood of Christ.
                </li>
              </ul>

              {/* Image Section */}
              <div className="flex justify-center py-6">
                <figure className="w-full max-w-md">
                  <img
                    src={process.env.PUBLIC_URL + '/images/10.jpg'}
                    alt="Sacred Heart Guild"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <figcaption className="text-center mt-2 text-gray-600">
                    Moyo Musande – Adult Guild Members
                  </figcaption>
                </figure>
              </div>

              {/* Members and Positions */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#2C1810] mb-4">Members and Positions</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto text-sm text-left text-gray-700 border border-amber-200">
                    <thead className="bg-[#1B3A6B] text-white">
                      <tr>
                        <th className="px-4 py-2">Member</th>
                        <th className="px-4 py-2">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2">Mrs A. Magejo</td>
                        <td className="px-4 py-2">Chairperson</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-2">Ms M. Chigwaza</td>
                        <td className="px-4 py-2">Vice Chairperson</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Mrs S. Tigere</td>
                        <td className="px-4 py-2">Promoter</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-2">Mr. P. Paratema</td>
                        <td className="px-4 py-2">Vice Promoter</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Ms P. Mashiri</td>
                        <td className="px-4 py-2">Secretary</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-2">Mrs P. Makina</td>
                        <td className="px-4 py-2">Vice Secretary</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Mrs S. Nkomo</td>
                        <td className="px-4 py-2">Treasurer</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-2">Mrs E. Musosa</td>
                        <td className="px-4 py-2">Finance Secretary</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Mr M. Sekanevana</td>
                        <td className="px-4 py-2">Committee Member</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-2">Mr E. Dumbura</td>
                        <td className="px-4 py-2">Committee Member</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Mr E. Chitsuwa</td>
                        <td className="px-4 py-2">Committee Member</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Formators */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#2C1810] mb-4">Formators</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <ul className="space-y-2 text-lg text-gray-700">
                    <li>Mrs G. Chakamba</li>
                    <li>Mrs V. Mutukwa</li>
                    <li>Mr C. Sekanevana</li>
                  </ul>
                  <ul className="space-y-2 text-lg text-gray-700">
                    <li>Mrs M. Chitsuwa</li>
                    <li>Mrs E.N. Paradzai</li>
                  </ul>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed mt-4">
                  The Sacred Heart of Jesus Guild operates under the guidance of the priests and the
                  leadership of the spiritual directors. The priests provide their time and support
                  whenever needed. Members who wish to join the guild are encouraged to learn more
                  about the guild.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mt-4">
                  Vatenderi vanoda kuvewo nhengo dze Chita vanogamuchirwa chaizvo, tinovakurudzira
                  kutanga kudzidzira kuva nhengo dzechita.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default Chemwoyo;
