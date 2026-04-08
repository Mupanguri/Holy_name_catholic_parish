import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const ContactPage = () => {
  const contacts = [
    {
      field: 'Contacts',
      color: 'bg-blue-parish',
      hoverColor: 'hover:bg-blue-dark',
      subFields: [
        {
          subField: 'Parish Office',
          numbers: [
            {
              number: '+263 242 306345',
              email: 'holynamemabelreign@gmail.com',
            },
          ],
        },
        {
          subField: 'Parish Priest',
          numbers: [
            {
              name: 'Fr Ndhlalambi',
              number: '+263772402220',
              email: 'jndhlalambi@gmail.com',
            },
          ],
        },
        {
          subField: 'Assistant Parish Priest',
          numbers: [
            {
              name: 'Fr Jingisoni',
              number: '+263772300024',
              email: 'giftjingison@gmail.com',
            },
          ],
        },
      ],
    },
    {
      field: 'Guilds',
      color: 'bg-[#2E7D32]',
      hoverColor: 'hover:bg-[#1B5E20]',
      subFields: [
        {
          subField: 'Emily Mari',
          numbers: [
            {
              name: 'Emily Mari',
              number: '+263777163212',
            },
          ],
        },
        {
          subField: 'Sacred Heart Youth Guild',
          numbers: [
            {
              name: 'Chairperson: Arthur Hukama',
              number: '+263 783808377',
            },
          ],
        },
        {
          subField: 'Hosi Yedenga',
          numbers: [
            {
              name: 'Mrs M Choto',
              number: '+263772847374',
            },
            {
              name: 'Mrs P Mautsa',
              number: '+263733756454',
            },
          ],
        },
      ],
    },
    {
      field: 'Sections',
      color: 'bg-[#C9A84C]',
      hoverColor: 'hover:bg-[#b8973f]',
      textColor: 'text-gray-900',
      subFields: [
        {
          subField: 'Parachute Regiment',
          numbers: [
            {
              name: 'Mr V Mudimu',
              number: '+263773382139',
            },
          ],
        },
        {
          subField: 'Bloomingdale',
          numbers: [
            {
              name: 'Mr Chisuro',
              number: '+263781907444',
            },
          ],
        },
        {
          subField: 'Meyrick Park',
          numbers: [
            {
              name: 'Mrs Thoko Nyandoro',
              number: '+263772423383',
            },
          ],
        },
      ],
    },
    {
      field: 'Groups',
      color: 'bg-[#BA0021]',
      hoverColor: 'hover:bg-[#9a001c]',
      subFields: [
        {
          subField: 'SOCCOM',
          numbers: [
            {
              name: 'Mr D Kunaka',
              number: '+263 775063153',
            },
            {
              name: 'Hunter Mupfurutsa',
              number: '+263 789864886',
            },
          ],
        },
        {
          subField: 'Catechesis',
          numbers: [
            {
              name: 'Mr Felix Manyimbiri',
              number: '+263772392965',
            },
          ],
        },
        {
          subField: 'Ministry of Matrimony',
          numbers: [
            {
              name: 'Mr Felix Manyimbiri',
              number: '+263772392965',
            },
          ],
        },
        {
          subField: 'Family Apostolate',
          numbers: [
            {
              name: 'Ms Leonora Mawire',
              number: '+263 774161458',
            },
          ],
        },
      ],
    },
  ];

  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">Contact Us</h1>
              <p className="hn-section-sub">Get in touch with Holy Name Parish</p>
              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {contacts.map((contact, index) => (
                  <div
                    key={index}
                    className={`${contact.color} ${contact.hoverColor} ${contact.textColor || 'text-white'} rounded-lg shadow-lg overflow-hidden transition-transform transform hover:scale-105`}
                  >
                    {/* Card Header */}
                    <div className="p-4 font-bold text-xl text-center border-b border-white/20">
                      {contact.field}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-4">
                      {contact.subFields.map((subField, subIndex) => (
                        <div key={subIndex} className="border-b border-white/10 pb-3 last:border-0">
                          <h3 className="font-semibold text-sm mb-2 opacity-90">
                            {subField.subField}
                          </h3>
                          {subField.numbers.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              {item.name && <p className="opacity-85">{item.name}</p>}
                              <a
                                href={`tel:${item.number}`}
                                className="font-medium hover:underline opacity-100"
                              >
                                {item.number}
                              </a>
                              {item.email && (
                                <div>
                                  <a
                                    href={`mailto:${item.email}`}
                                    className="text-xs hover:underline opacity-75"
                                  >
                                    {item.email}
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Google Map */}
              <div className="mt-4">
                <iframe
                  title="Google Map - Holy Name Catholic Church"
                  className="w-full h-80 rounded-lg shadow-lg"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src="https://maps.google.com/maps?width=520&height=400&hl=en&q=17%20Wessex%20Dr%20Harare+(Holy%20Name%20Catholic%20Church)&t=&z=14&ie=UTF8&iwloc=B&output=embed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default ContactPage;
