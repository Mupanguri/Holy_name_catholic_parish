import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const ChaMariya = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">Mary Queen of Heaven Guild</h1>
              <p className="hn-section-sub">Chita chaMariya Hosi Yedenga</p>
              <p className="text-gray-700 mb-4">
                The Mary Queen of Heaven Guild, a group of Catholic devotees, strives to follow
                Jesus Christ and lead a life pleasing to God, inspired by the example of Mary, the
                Mother of Jesus Christ, Queen of Heaven. They also serve the Church and foster
                devotion. The patroness of this Guild is MARY, THE MOTHER OF GOD
              </p>

              <p className="text-gray-700 mb-4">
                This Guild was founded by Fr. Leunis in Rome in the year 1553. Its main objective is
                to pray for the conversion of sinners through the intercession of the Blessed Virgin
                Mary, so that they may return to the fold of Christ. In Zimbabwe, it was established
                in the 1940s by Jesuit priests. It was founded as a Marian Sodality, a branch of the
                Sodality of Our Lady, which was already established in the Bulawayo Diocese.
              </p>

              <p className="text-gray-700 mb-4">
                In the Harare Diocese, it was started by Father Alois Nyanhete, who helped it spread
                to various areas where they worked, including Mbare, Highfields, and Mabvuku. This
                has since been replicated in other parishes and dioceses. Their main goal and desire
                in establishing this guild is for the devotees to be deeply rooted in and live out
                the Christian life at all times (in the spirit of the Holy Family: Jesus, Mary, and
                Joseph).
              </p>

              <p className="text-gray-700 mb-4">
                The name of the Guild was later changed in the following years to follow the title
                given to Mary, now known as Mary Queen of Heaven.
              </p>

              <p className="text-gray-700 mb-6">
                The main feast day of the Mary Queen of Heaven Guild is on August 22nd (Queenship).
              </p>

              {/* Objectives */}
              <div className="p-6 bg-white rounded-lg shadow-md mb-6 border border-amber-200">
                <h2 className="text-2xl font-bold mb-4 text-center text-[#2C1810]">Objectives</h2>
                <ul className="list-decimal list-inside space-y-3 text-gray-700">
                  <li>
                    <strong>To unite members</strong> in a bond of spiritual friendship and to live
                    a life pleasing to God.
                  </li>
                  <li>
                    <strong>To know, love, and serve the Church</strong> and to promote devotion to
                    Mary, the Mother of God.
                  </li>
                  <li>
                    <strong>To serve the Church</strong> by assisting and supporting parish
                    activities.
                  </li>
                  <li>
                    <strong>To promote devotion to Mary</strong> through:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>Daily prayer and meditation</li>
                      <li>Reciting the Rosary, Litanies, and Office of Mary</li>
                      <li>Observing Marian feast days</li>
                    </ul>
                  </li>
                  <li>
                    <strong>To deepen spiritual knowledge</strong> through:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>Studying Catechism</li>
                      <li>Educating children about the faith</li>
                      <li>Living according to God's Word</li>
                    </ul>
                  </li>
                  <li>
                    <strong>To perform acts of charity</strong> and to support the needy and the
                    parish community.
                  </li>
                </ul>
              </div>

              {/* Membership Requirements */}
              <div className="p-6 bg-white rounded-lg shadow-md mb-6 border border-amber-200">
                <h2 className="text-2xl font-bold mb-4 text-center text-[#2C1810]">
                  Membership Requirements and Obligations
                </h2>
                <ul className="list-decimal list-inside space-y-3 text-gray-700">
                  <li>
                    Be a practicing Catholic who honors and venerates Mary, the Mother of God.
                  </li>
                  <li>Attend all Guild meetings, such as weekly prayers.</li>
                  <li>Attend Holy Mass (Eucharist) and receive Holy Communion regularly.</li>
                  <li>Make regular Confessions.</li>
                  <li>Attend spiritual talks that foster spiritual growth.</li>
                  <li>Participate in annual Retreats/Recollections.</li>
                  <li>Support and encourage fellow members and leaders.</li>
                  <li>Perform assigned tasks and duties within the Guild and the Church.</li>
                  <li>Accept various tasks and responsibilities, including leadership roles.</li>
                  <li>
                    Traditional healers and spiritual leaders are <strong>not</strong> allowed to
                    join the Guild.
                  </li>
                </ul>
              </div>

              {/* Major Feast Days */}
              <h3 className="text-2xl font-semibold text-[#2C1810] mb-4">
                Major Feast Days of Mary, the Mother of God
              </h3>
              <div className="p-4 bg-white rounded-lg shadow-md mb-6 border border-amber-200">
                <h2 className="text-xl font-bold mb-4 text-[#2C1810]">
                  Feast Days of Mary in Zimbabwe
                </h2>
                <table className="table-auto border-collapse border border-gray-300 w-full">
                  <thead>
                    <tr className="bg-[#1B3A6B] text-white">
                      <th className="border border-gray-300 px-4 py-2">Date</th>
                      <th className="border border-gray-300 px-4 py-2">Feast Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { date: 'January 1', feast: 'Mary, Mother of God' },
                      { date: 'February 11', feast: 'Our Lady of Lourdes' },
                      { date: 'March 25', feast: 'Annunciation of the Lord' },
                      { date: 'May 13', feast: 'Our Lady of Fatima' },
                      { date: 'May 31', feast: 'The Visitation of Our Lady' },
                      {
                        date: 'June (Saturday following 2nd Sunday after Pentecost)',
                        feast: 'Immaculate Heart of Mary',
                      },
                      { date: 'July 16', feast: 'Our Lady of Mt. Carmel' },
                      { date: 'August 15', feast: 'Assumption of Our Lady' },
                      { date: 'August 22', feast: 'Mary, Queen of Peace' },
                      { date: 'September 8', feast: 'Birthday of Our Lady' },
                      { date: 'September 15', feast: 'Our Lady of Sorrows' },
                      { date: 'October 7', feast: 'Our Lady of the Rosary' },
                      { date: 'November 21', feast: 'The Presentation of the Blessed Virgin Mary' },
                      { date: 'December 8', feast: 'Immaculate Conception' },
                      { date: 'December 26', feast: 'Holy Family' },
                    ].map((feastDay, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-2">{feastDay.date}</td>
                        <td className="border border-gray-300 px-4 py-2">{feastDay.feast}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Images */}
              <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <img
                    src={process.env.PUBLIC_URL + '/images/7.jpg'}
                    alt="1"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <p className="mt-2 text-center text-gray-700">Mrs R Chaza</p>
                </div>
                <div>
                  <img
                    src={process.env.PUBLIC_URL + '/images/2.jpg'}
                    alt="2"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <p className="mt-2 text-center text-gray-700">Mrs V Nyamadzawo</p>
                </div>
                <div>
                  <img
                    src={process.env.PUBLIC_URL + '/images/3.jpg'}
                    alt="3"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <p className="mt-2 text-center text-gray-700">Mrs Mautsa</p>
                </div>
                <div>
                  <img
                    src={process.env.PUBLIC_URL + '/images/4.jpg'}
                    alt="4"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <p className="mt-2 text-center text-gray-700">Mrs S Moyo</p>
                </div>
                <div>
                  <img
                    src={process.env.PUBLIC_URL + '/images/5.jpg'}
                    alt="5"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <p className="mt-2 text-center text-gray-700">Mrs Kambarami</p>
                </div>
                <div>
                  <img
                    src={process.env.PUBLIC_URL + '/images/6.jpg'}
                    alt="6"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <p className="mt-2 text-center text-gray-700">Mrs Mabaudi</p>
                </div>
                <div>
                  <img
                    src={process.env.PUBLIC_URL + '/images/14.jpg'}
                    alt="7"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <p className="mt-2 text-center text-gray-700">Mrs Choto</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default ChaMariya;
