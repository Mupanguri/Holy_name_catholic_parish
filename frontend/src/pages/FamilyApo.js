import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalTheme from '../components/GlobalTheme';

const FamilyApo = () => {
  const navigate = useNavigate();

  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">Family Apostolate Committee</h1>
              <p className="hn-section-sub">
                Supporting, enriching, and nurturing families within our parish
              </p>
              {/* Executive Members Section */}
              <div className="space-y-6 mb-8">
                <h2 className="text-2xl font-bold text-[#2C1810]">Executive Members</h2>
                <table className="min-w-full table-auto border-collapse bg-white rounded-lg border border-amber-200">
                  <thead className="bg-[#1B3A6B] text-white">
                    <tr>
                      <th className="border-b border-gray-300 text-left py-2 px-4">Position</th>
                      <th className="border-b border-gray-300 text-left py-2 px-4">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border-b border-gray-200 py-2 px-4 font-semibold">
                        Chairperson
                      </td>
                      <td className="border-b border-gray-200 py-2 px-4">Ms Leonora Mawire</td>
                    </tr>
                    <tr>
                      <td className="border-b border-gray-200 py-2 px-4 font-semibold">
                        Vice Chairperson
                      </td>
                      <td className="border-b border-gray-200 py-2 px-4">Mrs Eunice Mahenga</td>
                    </tr>
                    <tr>
                      <td className="border-b border-gray-200 py-2 px-4 font-semibold">
                        Secretary
                      </td>
                      <td className="border-b border-gray-200 py-2 px-4">Ms Alice Chirenje</td>
                    </tr>
                    <tr>
                      <td className="border-b border-gray-200 py-2 px-4 font-semibold">
                        Vice Secretary
                      </td>
                      <td className="border-b border-gray-200 py-2 px-4">Miss Kathleen Chari</td>
                    </tr>
                    <tr>
                      <td className="border-b border-gray-200 py-2 px-4 font-semibold">
                        Committee Member
                      </td>
                      <td className="border-b border-gray-200 py-2 px-4">Mr E.R. Gambe</td>
                    </tr>
                    <tr>
                      <td className="border-b border-gray-200 py-2 px-4 font-semibold">
                        Committee Member
                      </td>
                      <td className="border-b border-gray-200 py-2 px-4">Mrs Linda N Dziva</td>
                    </tr>
                    <tr>
                      <td className="border-b border-gray-200 py-2 px-4 font-semibold">
                        Committee Member
                      </td>
                      <td className="border-b border-gray-200 py-2 px-4">Mrs Lindisi Doba</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* History Section */}
              <div className="space-y-6 mb-8">
                <h2 className="text-2xl font-bold text-[#2C1810]">Brief History/Background</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  The Family Apostolate Committee serves as a dedicated group focused on supporting,
                  enriching, and nurturing families within our parish. It aims to guide families to
                  live a true Christian life. The family is the primary agent of socialization from
                  which the Catholic congregation emanates. Hence, the Family Apostolate Committee
                  aims to promote prayerfulness and enhance the understanding of Catholicism within
                  families.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  The Family Apostolate was inspired by the need to promote spirituality and prayer
                  in the family. The Committee engages in pastoral care, promotes prayer life and
                  regular reception of the sacraments, imparts catechesis, offers opportunities for
                  family get-togethers, and connects families with the church and with one another.
                </p>

                <h2 className="text-2xl font-bold text-[#2C1810]">Mission</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  The mission of the Family Apostolate Committee is to promote the spiritual,
                  emotional, and physical well-being of families within the Catholic Church, helping
                  them to grow in faith, love, and unity according to the teachings of the Church.
                </p>

                <h2 className="text-2xl font-bold text-[#2C1810]">
                  Family Apostolate - Membership
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  The Family Apostolate Committee is open to all parishioners: married couples,
                  widows/widowers, singles, young adults, youths, single parents, separated parents,
                  as well as sisters and brothers; all of whom will represent the various sections
                  and interest groups of the Parish.
                </p>

                <h3 className="text-xl font-semibold text-[#2C1810]">
                  The following Family groups/committees are in existence or formation:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-700">
                  <li>Widows/widowers</li>
                  <li>Young Couples</li>
                  <li>Single Parents</li>
                  <li>Young Adults</li>
                  <li>Catering committee</li>
                </ul>
              </div>

              {/* Association Overview */}
              <div className="space-y-6 mb-8">
                <p className="text-lg text-gray-800">
                  Our association's main goal is to support widows. We aim to help them become
                  spiritually and financially stable by providing advice and motivation through
                  periodic sessions. Currently, we have 80 widows from Holy Name Parish, but no
                  widowers have joined yet, though we look forward to their participation.
                </p>

                <h3 className="text-2xl font-semibold text-[#2C1810]">Challenges</h3>
                <p className="text-gray-800">
                  Before forming the association, widows were largely invisible, with no
                  representation or opportunities to lead in the parish. We lacked a platform to
                  meet, discuss concerns, and support each other.
                </p>

                <h4 className="text-xl font-semibold text-gray-700 mb-2">Activities</h4>
                <ul className="list-disc pl-5 text-gray-800 mb-4">
                  <li>Monthly meetings, with ad hoc sessions when needed.</li>
                  <li>We have a uniform for our group.</li>
                  <li>The Chairperson represents us at the Parish Council.</li>
                  <li>We participate in parish events like the Parish Fun Day.</li>
                  <li>We support each other during family events such as weddings and funerals.</li>
                  <li>
                    We hosted a Widows Recollection Day, with a blessed session led by Fr Mubaiwa,
                    though attendance was low.
                  </li>
                </ul>

                <h3 className="text-2xl font-semibold text-[#2C1810]">Funeral Assistance</h3>
                <p className="text-gray-800">
                  We registered with Ecosure to help members during bereavement. While many have
                  existing funeral policies, Ecosure offers additional financial support, and all
                  members contribute to the monthly fee.
                </p>
              </div>

              {/* Contact Section */}
              <div className="space-y-6 text-center">
                <p className="text-lg text-[#2C1810]">
                  For our contacts under Family Apostolate Committee guilds, visit the contact page
                </p>

                <button
                  onClick={() => navigate('/contact')}
                  className="bg-[#BA0021] text-white px-6 py-2 rounded-full shadow-md hover:bg-[#97001a] transition"
                >
                  Go to Contact Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default FamilyApo;
