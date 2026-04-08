// ============================================
// CMS CONSTANTS - Single Source of Truth
// Used by AuthContext and CMSContext
// ============================================

// Post categories
export const POST_CATEGORIES = {
  PARISH_NOTICE: 'Parish Notice',
  EVENT_REPORT: 'Event Report',
  YOUTH_COMMITTEE: 'Youth Committee',
  ADULT_COMMITTEE: 'Adult Committee',
  BULLETIN: 'Bulletin',
  INTERNATIONAL_OUTREACH: 'International Outreach',
};

// Community branches for filtering
export const BRANCHES = [
  { id: 'sections', name: 'Sections' },
  { id: 'choir', name: 'Choir' },
  { id: 'committees', name: 'Committees' },
  { id: 'support-teams', name: 'Support Teams' },
  { id: 'adult-guilds', name: 'Adult Guilds' },
  { id: 'youth-guilds', name: 'Youth Guilds' },
];

// Guild channels
export const GUILD_CHANNELS = {
  // Sections
  SECTIONS: [
    { id: 'parachute-regiment', name: 'Parachute Regiment', slug: 'parachuteregime' },
    { id: 'avondale-west', name: 'Avondale West', slug: 'avondalew' },
    { id: 'bloomingdale', name: 'Bloomingdale', slug: 'bloom' },
    { id: 'meyrick-park', name: 'Meyrick Park', slug: 'meyrick' },
    { id: 'cotswold-hills', name: 'Cotswold Hills', slug: 'costwold' },
    { id: 'mabelreign-central', name: 'Mabelreign Central', slug: 'malbereign' },
    { id: 'haig-park', name: 'Haig Park', slug: 'haig' },
  ],
  // Choir
  CHOIR: [
    { id: 'english-choir', name: 'English Choir', slug: 'choir' },
    { id: 'shona-choir', name: 'Shona Choir', slug: 'choirshona' },
  ],
  // Committees
  COMMITTEES: [
    { id: 'parish-council', name: 'Parish Council', slug: 'MainGov' },
    { id: 'youth-council', name: 'Youth Council', slug: 'youth-council' },
    { id: 'altar-servers', name: 'Altar Servers', slug: 'altar-servers' },
    {
      id: 'missionary-childhood',
      name: 'Missionary Childhood Committee',
      slug: 'missionary-childhood',
    },
    { id: 'family-apostolate', name: 'Family Apostolate Committee', slug: 'FamilyApo' },
  ],
  // Support Teams
  SUPPORT_TEAMS: [
    { id: 'soccom', name: 'Soccom', slug: 'soccom' },
    { id: 'catechesis', name: 'Catechesis', slug: 'catechisis' },
    { id: 'ccr', name: 'Catholic Charismatic Renewal (CCR)', slug: 'ccr' },
    { id: 'special-events', name: 'Special Events Committee', slug: 'SpecialEvents' },
  ],
  // Adult Guilds
  ADULT_GUILDS: [
    { id: 'st-anne', name: 'St Anne (Mbuya Anna)', slug: 'st-anne' },
    {
      id: 'sacred-heart-adult',
      name: 'Sacred Heart of Jesus (Moyo Musande Kwazvo waYesu)',
      slug: 'chemwoyo',
    },
    { id: 'st-joachim', name: 'St Joachim', slug: 'st-joachim' },
    { id: 'st-joseph', name: 'St Joseph', slug: 'st-joseph' },
    { id: 'maria-hosi-yedenga', name: 'Maria Hosi Yedenga', slug: 'maria-hosi-yedenga' },
  ],
  // Youth Guilds
  YOUTH_GUILDS: [
    {
      id: 'peter-mary',
      name: "St's Peter and Mary (Nzanga Ya Peter na Maria)",
      slug: 'peter-mary',
    },
    { id: 'agnes-alois', name: 'St Agnes and Alois', slug: 'agnesandalois' },
    {
      id: 'sacred-heart-youth',
      name: 'Sacred Heart of Jesus (Moyo Musande Kwazvo wa Yesu)',
      slug: 'Musande',
    },
    { id: 'st-mary-youth', name: 'St Mary (Chita cha Maria)', slug: 'st-mary-youth' },
    { id: 'cya', name: 'Catholic Youth Association (CYA)', slug: 'cya' },
  ],
};
