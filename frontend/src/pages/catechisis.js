import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const CatechesisPage = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">Holy Name Catechesis</h1>
              <p className="hn-section-sub">Nurturing faith through education</p>
              {/* Leadership Table */}
              <section className="mb-8">
                <table className="w-full table-auto bg-white rounded-lg shadow-md text-center border border-amber-200">
                  <thead className="bg-[#1B3A6B] text-white">
                    <tr>
                      <th className="p-3">Role</th>
                      <th className="p-3">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border-b">Coordinator</td>
                      <td className="p-3 border-b">Mr. Felix Manyimbiri</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b">Vice-Coordinator</td>
                      <td className="p-3 border-b">Mr. John Makoni</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b">Secretary</td>
                      <td className="p-3 border-b">Ms. Kuzi Kambasha</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b">Treasurer</td>
                      <td className="p-3 border-b">Mrs. Phoebe Nzombe</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b">Committee Member</td>
                      <td className="p-3 border-b">Mrs. Maria Stella Chaniwa</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Catechesis Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#BA0021] uppercase text-center mb-4">
                  Catechesis Programs
                </h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    Holy Name Mabelreign Parish has an active catechesis consisting of the
                    following:
                  </p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>
                      <strong>Sunday School:</strong> Grade one to form six students are prepared
                      for Baptism, Holy Communion, Post Communion, and Confirmation classes. Classes
                      operate in tandem with the school term and are followed by children's Mass at
                      8:30am every Sunday at the Marian Centre.
                    </li>
                    <li>
                      <strong>Adult Catechesis:</strong> A comprehensive program for sacraments of
                      Baptism, Holy Communion, and Confirmation.
                    </li>
                    <li>
                      <strong>Infant Baptism:</strong> Held periodically with preparatory classes
                      for parents.
                    </li>
                    <li>
                      <strong>Marriage Classes:</strong> Three-week training for couples preparing
                      for matrimony.
                    </li>
                  </ol>
                </div>
              </section>

              {/* Ministry of Matrimony Table */}
              <section>
                <h2 className="text-2xl font-semibold text-[#BA0021] text-center mb-4">
                  Ministry of Matrimony
                </h2>
                <table className="w-full table-auto bg-pink-50 rounded-lg shadow-md text-center border border-amber-200">
                  <thead className="bg-[#BA0021] text-white">
                    <tr>
                      <th className="p-3">Role</th>
                      <th className="p-3">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border-b">Chairperson</td>
                      <td className="p-3 border-b">Mr. Felix Manyimbiri</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b">Committee Member</td>
                      <td className="p-3 border-b">Mrs. Taona Choto</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b">Committee Member</td>
                      <td className="p-3 border-b">Mr. Tafadzwa Choto</td>
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

export default CatechesisPage;
