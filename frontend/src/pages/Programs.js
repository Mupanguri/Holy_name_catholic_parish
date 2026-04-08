import React, { useState } from 'react';
import GlobalTheme from '../components/GlobalTheme';

// Liturgical colors and their meanings
const LITURGICAL_COLORS = {
  S: { name: 'Solemnity', color: '#FFD700', icon: '👑', textColor: '#000' }, // Gold
  F: { name: 'Feast', color: '#FF6B35', icon: '⭐', textColor: '#000' }, // Orange
  m: { name: 'Memorial', color: '#4A90D9', icon: '✝', textColor: '#000' }, // Blue
  d: { name: 'Doctor', color: '#9B59B6', icon: '📖', textColor: '#000' }, // Purple
};

// Sample liturgical events data parsed from calendar.txt
const LITURGICAL_EVENTS = [
  {
    date: 'January 1',
    name: 'Mary, Mother of God',
    type: 'S',
    year: 2026,
    readings: 'Numbers 6:22-27 / Psalm 67 / Gal 4:4-7 / Luke 2:16-21',
  },
  {
    date: 'January 6',
    name: 'Epiphany of the Lord',
    type: 'S',
    year: 2026,
    readings: 'Isaiah 60:1-6 / Psalm 72 / Eph 3:2-3, 5-6 / Matt 2:1-12',
  },
  {
    date: 'January 12',
    name: 'The Baptism of the Lord',
    type: 'F',
    year: 2026,
    readings: 'Isaiah 42:1-4, 6-7 / Psalm 29 / Acts 10:34-38 / Luke 3:15-16, 21-22',
  },
  {
    date: 'January 19',
    name: '2nd Sunday in Ordinary Time',
    type: 'S',
    year: 2026,
    readings: 'Isaiah 62:1-5 / Psalm 96 / 1 Cor 12:4-11 / John 2:1-11',
  },
  {
    date: 'January 26',
    name: '3rd Sunday in Ordinary Time',
    type: 'S',
    year: 2026,
    readings: 'Neh 8:2-4, 5-6, 8-10 / Psalm 19 / 1 Cor 12:12-30 / Luke 1:1-4; 4:14-21',
  },
  {
    date: 'February 2',
    name: 'Presentation of the Lord',
    type: 'F',
    year: 2026,
    readings: 'Mal 3:1-4 / Psalm 84 / Heb 2:14-18 / Luke 2:22-40',
  },
  {
    date: 'February 9',
    name: '5th Sunday in Ordinary Time',
    type: 'S',
    year: 2026,
    readings: 'Isa 6:1-2, 3-8 / Ps 138 / 1 Cor 15:1-11 / Luke 5:1-11',
  },
  {
    date: 'February 16',
    name: '6th Sunday in Ordinary Time',
    type: 'S',
    year: 2026,
    readings: 'Jer 17:5-8 / Psalm 1 / 1 Cor 15:12, 16-20 / Luke 6:17, 20-26',
  },
  {
    date: 'February 18',
    name: 'Ash Wednesday',
    type: 'F',
    year: 2026,
    readings: 'Joel 2:12-18 / Psalm 51 / 2 Cor 5:20 - 6:10 / Matt 6:1-6, 16-18',
  },
  {
    date: 'February 23',
    name: '1st Sunday of Lent',
    type: 'S',
    year: 2026,
    readings: 'Deut 26:4-10 / Psalm 91 / Rom 10:8-13 / Luke 4:1-13',
  },
  {
    date: 'March 2',
    name: '2nd Sunday of Lent',
    type: 'S',
    year: 2026,
    readings: 'Gen 15:5-12, 17-18 / Psalm 27 / Phil 3:17 - 4:1 / Luke 9:28-36',
  },
  {
    date: 'March 9',
    name: '3rd Sunday of Lent',
    type: 'S',
    year: 2026,
    readings: 'Exod 3:1-8, 13-15 / Psalm 103 / 1 Cor 10:1-6, 10-12 / Luke 13:1-9',
  },
  {
    date: 'March 16',
    name: '4th Sunday of Lent',
    type: 'S',
    year: 2026,
    readings: '1 Sam 16:1, 6-7, 10-13 / Psalm 23 / Eph 5:8-14 / John 9:1-41',
  },
  {
    date: 'March 23',
    name: '5th Sunday of Lent',
    type: 'S',
    year: 2026,
    readings: 'Ezek 37:12-14 / Psalm 130 / Rom 8:8-11 / John 11:1-45',
  },
  {
    date: 'March 25',
    name: 'Annunciation of the Lord',
    type: 'S',
    year: 2026,
    readings: 'Isa 7:10-14 / Psalm 40 / Heb 10:4-10 / Luke 1:26-38',
  },
  {
    date: 'March 29',
    name: 'Palm Sunday',
    type: 'S',
    year: 2026,
    readings: 'Isa 50:4-7 / Psalm 22 / Phil 2:6-11 / Luke 22:14 - 23:56',
  },
  {
    date: 'April 3',
    name: 'Holy Thursday',
    type: 'S',
    year: 2026,
    readings: 'Exod 12:1-8, 11-14 / Psalm 116 / 1 Cor 11:23-26 / John 13:1-15',
  },
  {
    date: 'April 4',
    name: 'Good Friday',
    type: 'S',
    year: 2026,
    readings: 'Isa 52:13 - 53:12 / Psalm 31 / Heb 4:14-16; 5:7-9 / John 18:1 - 19:42',
  },
  {
    date: 'April 5',
    name: 'Easter Vigil',
    type: 'S',
    year: 2026,
    readings: 'Gen 1:1 - 2:2 / Psalm 104 / Rom 6:3-11 / Luke 24:1-12',
  },
  {
    date: 'April 6',
    name: 'Easter Sunday',
    type: 'S',
    year: 2026,
    readings: 'Acts 10:34, 37-43 / Psalm 118 / Col 3:1-4 / John 20:1-9',
  },
  {
    date: 'April 12',
    name: 'Divine Mercy Sunday',
    type: 'S',
    year: 2026,
    readings: 'Acts 4:32-35 / Psalm 118 / 1 John 5:1-6 / John 20:19-31',
  },
  {
    date: 'April 19',
    name: '2nd Sunday of Easter',
    type: 'S',
    year: 2026,
    readings: 'Acts 5:12-16 / Psalm 118 / Rev 1:9-11, 12-13, 17-19 / John 20:19-31',
  },
  {
    date: 'April 26',
    name: '3rd Sunday of Easter',
    type: 'S',
    year: 2026,
    readings: 'Acts 5:27-32, 40-41 / Psalm 30 / Rev 5:11-14 / Luke 24:13-35',
  },
  {
    date: 'May 3',
    name: '4th Sunday of Easter',
    type: 'S',
    year: 2026,
    readings: 'Acts 9:26-31 / Psalm 22 / 1 John 3:18-24 / John 15:1-8',
  },
  {
    date: 'May 10',
    name: '5th Sunday of Easter',
    type: 'S',
    year: 2026,
    readings: 'Acts 14:21-27 / Psalm 145 / Rev 21:10, 14-18, 20-21 / John 13:31-35',
  },
  {
    date: 'May 17',
    name: '6th Sunday of Easter',
    type: 'S',
    year: 2026,
    readings: 'Acts 15:1-2, 22-29 / Psalm 67 / Rev 21:10-14, 22-23 / John 14:23-29',
  },
  {
    date: 'May 21',
    name: 'Ascension of the Lord',
    type: 'S',
    year: 2026,
    readings: 'Acts 1:1-11 / Psalm 47 / Eph 1:17-23 / Luke 24:46-53',
  },
  {
    date: 'May 24',
    name: 'Pentecost Sunday',
    type: 'S',
    year: 2026,
    readings: 'Acts 2:1-11 / Psalm 104 / 1 Cor 12:3-7, 12-13 / John 20:19-23',
  },
  {
    date: 'May 31',
    name: 'Holy Trinity Sunday',
    type: 'S',
    year: 2026,
    readings: 'Deut 4:32-34, 39-40 / Psalm 33 / Rom 8:14-17 / Matt 28:16-20',
  },
  {
    date: 'June 7',
    name: 'Corpus Christi',
    type: 'S',
    year: 2026,
    readings: 'Deut 8:2-3, 14-16 / Psalm 147 / 1 Cor 10:16-17 / John 6:51-58',
  },
  {
    date: 'June 14',
    name: '11th Sunday in Ordinary Time',
    type: 'S',
    year: 2026,
    readings: 'Ezek 17:22-24 / Psalm 92 / 2 Cor 5:6-10 / Mark 4:26-34',
  },
  {
    date: 'June 21',
    name: '12th Sunday in Ordinary Time',
    type: 'S',
    year: 2026,
    readings: 'Job 38:1, 8-11 / Psalm 116 / 2 Cor 5:14-17 / Mark 4:35-41',
  },
  {
    date: 'June 28',
    name: '13th Sunday in Ordinary Time',
    type: 'S',
    year: 2026,
    readings: 'Wis 1:13-15; 2:23-24 / Psalm 30 / 2 Cor 8:7, 9, 13-15 / Mark 5:21-43',
  },
  {
    date: 'June 29',
    name: 'Sts. Peter & Paul, Apostles',
    type: 'S',
    year: 2026,
    readings: 'Acts 12:1-11 / Psalm 34 / 2 Tim 4:6-8, 17-18 / Matt 16:13-19',
  },
];

// Parish events from calendar.txt
const PARISH_EVENTS = [
  { date: 'January 4', name: 'Petitions - Avondale West PLC Exec Meeting', category: 'Meeting' },
  { date: 'January 5', name: "Fr Jingisoni's Birthday", category: 'Celebration' },
  { date: 'January 11', name: 'Petitions - Belvedere', category: 'Petitions' },
  { date: 'January 12', name: "Fr Ndhlalambi's Ordination Anniversary", category: 'Celebration' },
  { date: 'January 15', name: 'Youth Fundraising Car Wash', category: 'Youth' },
  { date: 'January 18', name: 'PLC Meeting - Zvita Coordinators', category: 'Meeting' },
  { date: 'January 19', name: 'Recollection', category: 'Spiritual' },
  { date: 'January 22', name: 'Petitions - Bloomingdale', category: 'Petitions' },
  { date: 'January 25', name: 'Youth Mass', category: 'Mass' },
  { date: 'January 26', name: 'Petitions - Bluffhill', category: 'Petitions' },
  { date: 'February 1', name: 'PLC Exec Meeting', category: 'Meeting' },
  { date: 'February 8', name: 'PFC Fun Run (Half Marathon)', category: 'Fundraising' },
  { date: 'February 9', name: 'Youth SPM All Night Prayer', category: 'Youth' },
  { date: 'February 15', name: 'Petitions - Cotswold Hills', category: 'Petitions' },
  { date: 'February 22', name: 'Parish Lenten Retreat', category: 'Spiritual' },
  { date: 'February 23', name: 'Lenten Penitential Service', category: 'Spiritual' },
  { date: 'March 8', name: 'Petitions - Meyrick Park', category: 'Petitions' },
  { date: 'March 15', name: 'Petitions - Madokero', category: 'Petitions' },
  { date: 'March 22', name: 'Petitions - Mabelreign Central', category: 'Petitions' },
  { date: 'April 5', name: 'Youth Guilds Parish Visit', category: 'Youth' },
  { date: 'April 12', name: 'Petitions - Avondale West', category: 'Petitions' },
  { date: 'April 19', name: 'Parish AGM', category: 'Meeting' },
  { date: 'April 26', name: 'PFC Family Fun Day & Business Expo', category: 'Event' },
  { date: 'May 3', name: 'Petitions - Belvedere', category: 'Petitions' },
  { date: 'May 10', name: 'Youth Cake Sale', category: 'Youth' },
  { date: 'May 17', name: "Fr Ndhlalambi's Birthday", category: 'Celebration' },
  { date: 'May 24', name: 'MCA Day Celebration', category: 'Celebration' },
  { date: 'May 31', name: 'Petitions - Meyrick Park', category: 'Petitions' },
  { date: 'June 7', name: 'Petitions - Sentosa', category: 'Petitions' },
  { date: 'June 14', name: 'Youth Pilgrimage (Botswana/Namibia)', category: 'Youth' },
  { date: 'June 21', name: 'Youth St Alouis Day', category: 'Youth' },
  { date: 'June 28', name: 'Youth Guilds Reception', category: 'Youth' },
  { date: 'July 5', name: "Fr Jingisoni's Ordination Anniversary", category: 'Celebration' },
];

const Programs = () => {
  const [activeTab, setActiveTab] = useState('liturgical');

  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="hn-section-heading">Programs Calendar</h1>
                <p className="hn-section-sub">Liturgical and Parish Events for 2026</p>
              </div>

              {/* Tab Navigation */}
              <div className="flex justify-center mb-6">
                <div className="bg-white rounded-lg shadow p-1 flex">
                  <button
                    onClick={() => setActiveTab('liturgical')}
                    className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                      activeTab === 'liturgical'
                        ? 'bg-[#1B3A6B] text-white'
                        : 'text-[#1B3A6B] hover:bg-gray-100'
                    }`}
                  >
                    📅 Liturgical
                  </button>
                  <button
                    onClick={() => setActiveTab('parish')}
                    className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                      activeTab === 'parish'
                        ? 'bg-[#BA0021] text-white'
                        : 'text-[#BA0021] hover:bg-gray-100'
                    }`}
                  >
                    ⛪ Parish
                  </button>
                </div>
              </div>

              {/* Liturgical Events Section */}
              {activeTab === 'liturgical' && (
                <div className="space-y-6">
                  <div className="grid gap-6">
                    {LITURGICAL_EVENTS.map((event, index) => {
                      const colorInfo = LITURGICAL_COLORS[event.type] || LITURGICAL_COLORS['m'];
                      return (
                        <div
                          key={index}
                          className="relative overflow-hidden rounded shadow"
                          style={{
                            background: `linear-gradient(135deg, #FDF5E6 0%, #FAF0E6 100%)`,
                            borderLeft: `4px solid ${colorInfo.color}`,
                          }}
                        >
                          <div className="relative p-4 flex items-start gap-3">
                            {/* Date Badge */}
                            <div
                              className="flex-shrink-0 w-14 h-14 rounded flex flex-col items-center justify-center text-white font-bold text-xs"
                              style={{ backgroundColor: colorInfo.color }}
                            >
                              <span className="text-lg">{colorInfo.icon}</span>
                              <span className="text-[10px]">{colorInfo.name}</span>
                            </div>

                            {/* Content */}
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-bold text-[#2C1810]">{event.name}</h3>
                                <span
                                  className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                                  style={{ backgroundColor: colorInfo.color }}
                                >
                                  {colorInfo.name}
                                </span>
                              </div>
                              <p className="text-[#5D4E37] font-medium mb-3">
                                {event.date}, {event.year}
                              </p>

                              {/* Readings */}
                              <div className="bg-white/60 rounded-lg p-4 border border-amber-200">
                                <h4 className="font-semibold text-[#8B4513] mb-2 flex items-center gap-2">
                                  📖 Daily Readings
                                </h4>
                                <p className="text-[#5D4E37] text-sm leading-relaxed">
                                  {event.readings}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Parish Events Section */}
              {activeTab === 'parish' && (
                <div className="grid gap-4">
                  {PARISH_EVENTS.map((event, index) => {
                    // Color coding by category
                    const categoryColors = {
                      Meeting: '#1B3A6B',
                      Youth: '#BA0021',
                      Spiritual: '#6B8E23',
                      Petitions: '#FF8C00',
                      Celebration: '#FFD700',
                      Mass: '#8B4513',
                      Fundraising: '#4B0082',
                      Event: '#20B2AA',
                    };
                    const categoryColor = categoryColors[event.category] || '#666';

                    return (
                      <div
                        key={index}
                        className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4 hover:shadow-lg transition-shadow border-l-4"
                        style={{ borderLeftColor: categoryColor }}
                      >
                        <div className="flex-shrink-0">
                          <span className="text-xl">
                            {event.category === 'Meeting' && '📋'}
                            {event.category === 'Youth' && '🎉'}
                            {event.category === 'Spiritual' && '🕯️'}
                            {event.category === 'Petitions' && '🙏'}
                            {event.category === 'Celebration' && '🎊'}
                            {event.category === 'Mass' && '⛪'}
                            {event.category === 'Fundraising' && '💰'}
                            {event.category === 'Event' && '📅'}
                          </span>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-gray-800">{event.name}</h3>
                            <span
                              className="px-2 py-0.5 rounded text-[10px] text-white font-medium"
                              style={{ backgroundColor: categoryColor }}
                            >
                              {event.category}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs">{event.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Parish Events Section */}
              {activeTab === 'parish' && (
                <div className="grid gap-3">
                  {PARISH_EVENTS.map((event, index) => {
                    const categoryColors = {
                      Meeting: '#1B3A6B',
                      Youth: '#BA0021',
                      Spiritual: '#6B8E23',
                      Petitions: '#FF8C00',
                      Celebration: '#FFD700',
                      Mass: '#8B4513',
                      Fundraising: '#4B0082',
                      Event: '#20B2AA',
                    };
                    const categoryColor = categoryColors[event.category] || '#666';

                    return (
                      <div
                        key={index}
                        className="bg-white rounded shadow p-3 flex items-center gap-3 hover:shadow transition-shadow border-l-4"
                        style={{ borderLeftColor: categoryColor }}
                      >
                        <div className="flex-shrink-0">
                          <span className="text-xl">
                            {event.category === 'Meeting' && '📋'}
                            {event.category === 'Youth' && '🎉'}
                            {event.category === 'Spiritual' && '🕯️'}
                            {event.category === 'Petitions' && '🙏'}
                            {event.category === 'Celebration' && '🎊'}
                            {event.category === 'Mass' && '⛪'}
                            {event.category === 'Fundraising' && '💰'}
                            {event.category === 'Event' && '📅'}
                          </span>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-gray-800">{event.name}</h3>
                            <span
                              className="px-2 py-0.5 rounded text-[10px] text-white font-medium"
                              style={{ backgroundColor: categoryColor }}
                            >
                              {event.category}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs">{event.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default Programs;
