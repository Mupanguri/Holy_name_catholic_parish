// Page Templates Configuration
// Defines all available templates for the new page creation system

export const PAGE_TEMPLATES = {
  // Programs Category
  programs: {
    label: 'Programs',
    templates: [
      {
        id: 'liturgical-events',
        name: 'Liturgical Events',
        description: 'Template for liturgical event pages (Mass times, confessions, etc.)',
        path: '/programs',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Section Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
          {
            id: 'schedule',
            label: 'Schedule',
            fields: [
              { id: 'day', label: 'Day', type: 'text', required: true },
              { id: 'time', label: 'Time', type: 'text', required: true },
              { id: 'notes', label: 'Notes', type: 'textarea', required: false },
            ],
          },
        ],
      },
      {
        id: 'parish-events',
        name: 'Parish Events',
        description: 'Template for parish event announcements',
        path: '/programs',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Section Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
          {
            id: 'events-list',
            label: 'Events',
            fields: [
              { id: 'eventName', label: 'Event Name', type: 'text', required: true },
              { id: 'eventDate', label: 'Date', type: 'text', required: true },
              { id: 'eventDescription', label: 'Description', type: 'textarea', required: false },
              { id: 'eventImage', label: 'Event Image', type: 'image', required: false },
            ],
          },
        ],
      },
    ],
  },

  // Contact Category
  contact: {
    label: 'Contact',
    templates: [
      {
        id: 'contact-page',
        name: 'Contact Page',
        description: 'Standard contact page with form and church details',
        path: '/contact',
        sections: [
          {
            id: 'church-info',
            label: 'Church Information',
            fields: [
              { id: 'churchName', label: 'Church Name', type: 'text', required: true },
              { id: 'address', label: 'Address', type: 'textarea', required: true },
              { id: 'phone', label: 'Phone', type: 'text', required: false },
              { id: 'email', label: 'Email', type: 'text', required: false },
            ],
          },
          {
            id: 'contact-form',
            label: 'Contact Form',
            fields: [
              { id: 'formFields', label: 'Form Fields to Include', type: 'multiselect', options: ['Name', 'Email', 'Phone', 'Message'] },
            ],
          },
        ],
      },
    ],
  },

  // Communities/Guilds Category
  guilds: {
    label: 'Guilds',
    templates: [
      // Adult Guilds
      {
        id: 'st-anne-guild',
        name: 'St Anne Guild',
        description: 'Template for St Anne Guild page',
        path: '/communities/adult-guilds/st-anne',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
          {
            id: 'officers',
            label: 'Guild Officers',
            fields: [
              { id: 'role', label: 'Role', type: 'text', required: true },
              { id: 'name', label: 'Name', type: 'text', required: true },
              { id: 'contact', label: 'Contact', type: 'text', required: false },
            ],
          },
          {
            id: 'activities',
            label: 'Activities',
            fields: [
              { id: 'activity', label: 'Activity', type: 'text', required: true },
              { id: 'description', label: 'Description', type: 'textarea', required: false },
            ],
          },
        ],
      },
      {
        id: 'st-joachim-guild',
        name: 'St Joachim Guild',
        description: 'Template for St Joachim Guild page',
        path: '/communities/adult-guilds/st-joachim',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
          {
            id: 'officers',
            label: 'Guild Officers',
            fields: [
              { id: 'role', label: 'Role', type: 'text', required: true },
              { id: 'name', label: 'Name', type: 'text', required: true },
            ],
          },
        ],
      },
      {
        id: 'st-joseph-guild',
        name: 'St Joseph Guild',
        description: 'Template for St Joseph Guild page',
        path: '/communities/adult-guilds/st-joseph',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      // Youth Guilds
      {
        id: 'cya',
        name: 'CYA (Catholic Youth Action)',
        description: 'Template for CYA page',
        path: '/communities/youth-guilds/cya',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
          {
            id: 'activities',
            label: 'Activities',
            fields: [
              { id: 'activity', label: 'Activity', type: 'text', required: true },
              { id: 'description', label: 'Description', type: 'textarea', required: false },
            ],
          },
        ],
      },
      {
        id: 'altar-servers',
        name: 'Altar Servers',
        description: 'Template for Altar Servers page',
        path: '/communities/committees/altar-servers',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
          {
            id: 'requirements',
            label: 'Requirements',
            fields: [
              { id: 'requirement', label: 'Requirement', type: 'text', required: true },
            ],
          },
        ],
      },
      {
        id: 'st-agnes-alois',
        name: "St Agnes and Alois",
        description: 'Template for St Agnes and Alois Guild page',
        path: '/communities/youth-guilds/agnes-alois',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'st-peter-mary',
        name: "St's Peter and Mary",
        description: 'Template for St Peter and Mary Guild page',
        path: '/communities/youth-guilds/st-peter-mary',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'st-mary-youth',
        name: 'St Mary Youth',
        description: 'Template for St Mary Youth page',
        path: '/communities/youth-guilds/st-mary-youth',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'musande-youth',
        name: 'Moyo Musande Youth',
        description: 'Template for Moyo Musande Youth Guild page',
        path: '/communities/youth-guilds/musande',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
    ],
  },

  // Choir Category
  choir: {
    label: 'Choir',
    templates: [
      {
        id: 'english-choir',
        name: 'English Choir',
        description: 'Template for English Choir page',
        path: '/communities/choir/english',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
          {
            id: 'schedule',
            label: 'Practice Schedule',
            fields: [
              { id: 'day', label: 'Day', type: 'text', required: true },
              { id: 'time', label: 'Time', type: 'text', required: true },
              { id: 'location', label: 'Location', type: 'text', required: false },
            ],
          },
        ],
      },
      {
        id: 'shona-choir',
        name: 'Shona Choir',
        description: 'Template for Shona Choir page',
        path: '/communities/choir/shona',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
    ],
  },

  // Committees Category
  committees: {
    label: 'Committees',
    templates: [
      {
        id: 'main-gov',
        name: 'Parish Council',
        description: 'Template for Main Governance page',
        path: '/communities/committees/main-gov',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
          {
            id: 'members',
            label: 'Council Members',
            fields: [
              { id: 'position', label: 'Position', type: 'text', required: true },
              { id: 'name', label: 'Name', type: 'text', required: true },
            ],
          },
        ],
      },
      {
        id: 'youth-council',
        name: 'Youth Council',
        description: 'Template for Youth Council page',
        path: '/communities/committees/youth-council',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'altar-servers-committee',
        name: 'Altar Servers Committee',
        description: 'Template for Altar Servers page',
        path: '/communities/committees/altar-servers',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'missionary-childhood',
        name: 'Missionary Childhood',
        description: 'Template for Missionary Childhood page',
        path: '/communities/committees/missionary-childhood',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'family-apostolate',
        name: 'Family Apostolate',
        description: 'Template for Family Apostolate page',
        path: '/communities/committees/family-apostolate',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
    ],
  },

  // Support Teams Category
  supportTeams: {
    label: 'Support Teams',
    templates: [
      {
        id: 'soccom',
        name: 'SOCCOM',
        description: 'Template for Social Communications Committee',
        path: '/communities/support-teams/soccom',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
          {
            id: 'members',
            label: 'Committee Members',
            fields: [
              { id: 'role', label: 'Role', type: 'text', required: true },
              { id: 'name', label: 'Name', type: 'text', required: true },
              { id: 'contact', label: 'Contact', type: 'text', required: false },
            ],
          },
        ],
      },
      {
        id: 'catechesis',
        name: 'Catechesis',
        description: 'Template for Catechesis page',
        path: '/communities/support-teams/catechesis',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'ccr',
        name: 'CCR (Charismatic Renewal)',
        description: 'Template for CCR page',
        path: '/communities/support-teams/ccr',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'special-events',
        name: 'Special Events',
        description: 'Template for Special Events page',
        path: '/events/special-events',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
    ],
  },

  // Adult Guilds Category
  adultGuilds: {
    label: 'Adult Guilds',
    templates: [
      {
        id: 'chemwoyo',
        name: 'Moyo Musande (Sacred Heart)',
        description: 'Template for Chemwoyo/Moyo Musande page',
        path: '/communities/adult-guilds/chemwoyo',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'chamariya',
        name: 'Mary Queen of Heaven',
        description: 'Template for Cha Mariya page',
        path: '/communities/adult-guilds/chamariya',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
    ],
  },

  // Sections Category (Geographic Areas)
  sections: {
    label: 'Sections',
    templates: [
      {
        id: 'parachute-regiment',
        name: 'Parachute Regiment',
        description: 'Template for Parachute Regiment section',
        path: '/communities/sections/parachute-regiment',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'avondale-west',
        name: 'Avondale West',
        description: 'Template for Avondale West section',
        path: '/communities/sections/avondale-west',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'bloomingdale',
        name: 'Bloomingdale',
        description: 'Template for Bloomingdale section',
        path: '/communities/sections/bloomingdale',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'meyrick-park',
        name: 'Meyrick Park',
        description: 'Template for Meyrick Park section',
        path: '/communities/sections/meyrick-park',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'cotswold-hills',
        name: 'Cotswold Hills',
        description: 'Template for Cotswold Hills section',
        path: '/communities/sections/cotswold-hills',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'mabelreign-central',
        name: 'Mabelreign Central',
        description: 'Template for Mabelreign Central section',
        path: '/communities/sections/mabelreign-central',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
      {
        id: 'haig-park',
        name: 'Haig Park',
        description: 'Template for Haig Park section',
        path: '/communities/sections/haig-park',
        sections: [
          {
            id: 'intro',
            label: 'Introduction',
            fields: [
              { id: 'title', label: 'Title', type: 'text', required: true },
              { id: 'content', label: 'Description', type: 'textarea', required: true },
            ],
          },
        ],
      },
    ],
  },
};

// Page Path Dropdown Options (hierarchical structure)
export const PAGE_PATHS = [
  {
    label: 'Programs',
    value: '/programs',
    children: [
      { label: 'Liturgical Events', value: '/programs/liturgical-events' },
      { label: 'Parish Events', value: '/programs/parish-events' },
    ],
  },
  {
    label: 'Contact',
    value: '/contact',
    children: [],
  },
  {
    label: 'Communities',
    value: '/communities',
    children: [
      {
        label: 'Sections',
        value: '/communities/sections',
        children: [
          { label: 'Parachute Regiment', value: '/communities/sections/parachute-regiment' },
          { label: 'Avondale West', value: '/communities/sections/avondale-west' },
          { label: 'Bloomingdale', value: '/communities/sections/bloomingdale' },
          { label: 'Meyrick Park', value: '/communities/sections/meyrick-park' },
          { label: 'Cotswold Hills', value: '/communities/sections/cotswold-hills' },
          { label: 'Mabelreign Central', value: '/communities/sections/mabelreign-central' },
          { label: 'Haig Park', value: '/communities/sections/haig-park' },
        ],
      },
      {
        label: 'Choir',
        value: '/communities/choir',
        children: [
          { label: 'English Choir', value: '/communities/choir/english' },
          { label: 'Shona Choir', value: '/communities/choir/shona' },
        ],
      },
      {
        label: 'Committees',
        value: '/communities/committees',
        children: [
          { label: 'Parish Council', value: '/communities/committees/main-gov' },
          { label: 'Youth Council', value: '/communities/committees/youth-council' },
          { label: 'Altar Servers', value: '/communities/committees/altar-servers' },
          { label: 'Missionary Childhood', value: '/communities/committees/missionary-childhood' },
          { label: 'Family Apostolate', value: '/communities/committees/family-apostolate' },
        ],
      },
      {
        label: 'Support Teams',
        value: '/communities/support-teams',
        children: [
          { label: 'SOCCOM', value: '/communities/support-teams/soccom' },
          { label: 'Catechesis', value: '/communities/support-teams/catechesis' },
          { label: 'CCR', value: '/communities/support-teams/ccr' },
          { label: 'Special Events', value: '/events/special-events' },
        ],
      },
      {
        label: 'Adult Guilds',
        value: '/communities/adult-guilds',
        children: [
          { label: 'Moyo Musande (Sacred Heart)', value: '/communities/adult-guilds/chemwoyo' },
          { label: 'St Anne', value: '/communities/adult-guilds/st-anne' },
          { label: 'St Joachim', value: '/communities/adult-guilds/st-joachim' },
          { label: 'St Joseph', value: '/communities/adult-guilds/st-joseph' },
          { label: 'Mary Queen of Heaven', value: '/communities/adult-guilds/chamariya' },
        ],
      },
      {
        label: 'Youth Guilds',
        value: '/communities/youth-guilds',
        children: [
          { label: 'Moyo Musande (Sacred Heart)', value: '/communities/youth-guilds/musande' },
          { label: 'St Agnes & Alois', value: '/communities/youth-guilds/agnes-alois' },
          { label: "St's Peter and Mary", value: '/communities/youth-guilds/st-peter-mary' },
          { label: 'St Mary Youth', value: '/communities/youth-guilds/st-mary-youth' },
          { label: 'CYA', value: '/communities/youth-guilds/cya' },
        ],
      },
    ],
  },
  {
    label: 'Events',
    value: '/events',
    children: [
      { label: 'Special Events', value: '/events/special-events' },
      { label: 'Vatican', value: '/events/vatican' },
    ],
  },
];

// Helper function to get template by ID
export const getTemplateById = (templateId) => {
  for (const category of Object.values(PAGE_TEMPLATES)) {
    const template = category.templates?.find(t => t.id === templateId);
    if (template) return template;
  }
  return null;
};

// Helper function to get all templates as flat array
export const getAllTemplates = () => {
  const templates = [];
  for (const category of Object.values(PAGE_TEMPLATES)) {
    if (category.templates) {
      templates.push(...category.templates);
    }
  }
  return templates;
};

// Helper function to get allowed paths for a template
export const getTemplateAllowedPaths = (template) => {
  if (!template) return [];

  // Get the base path from template
  const basePath = template.path || '/';

  // Return the base path as the allowed path
  return [basePath];
};
