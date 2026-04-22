// Path Mapping Utility
// Maps old /about/ paths to new /communities/{category}/{slug} paths
// Also handles dynamic paths for custom pages

// Dynamic path patterns
const DYNAMIC_PATTERNS = {
  'sections': 'communities/sections',
  'choir': 'communities/choir',
  'committees': 'communities/committees',
  'support-teams': 'communities/support-teams',
  'adult-guilds': 'communities/adult-guilds',
  'youth-guilds': 'communities/youth-guilds',
};

export const pathMappings = {
  // Committees
  'about/main-gov': 'communities/committees/main-gov',
  'about/family-apostolate': 'communities/committees/family-apostolate',
  'about/soccom': 'communities/support-teams/soccom',
  'about/catechesis': 'communities/support-teams/catechesis',
  'about/ccr': 'communities/support-teams/ccr',
  'about/youth-council': 'communities/committees/youth-council',
  'about/YouthCouncil': 'communities/committees/youth-council',
  'about/altar-servers': 'communities/committees/altar-servers',
  'about/AltarServers': 'communities/committees/altar-servers',
  'about/missionary-childhood': 'communities/committees/missionary-childhood',
  'about/MissionaryChildhood': 'communities/committees/missionary-childhood',
  
  // Adult Guilds
  'about/chemwoyo': 'communities/adult-guilds/chemwoyo',
  'about/chamariya': 'communities/adult-guilds/chamariya',
  'about/st-anne': 'communities/adult-guilds/st-anne',
  'about/StAnne': 'communities/adult-guilds/st-anne',
  'about/st-joachim': 'communities/adult-guilds/st-joachim',
  'about/StJoachim': 'communities/adult-guilds/st-joachim',
  'about/st-joseph': 'communities/adult-guilds/st-joseph',
  'about/StJoseph': 'communities/adult-guilds/st-joseph',
  
  // Youth Guilds
  'about/cya': 'communities/youth-guilds/cya',
  'about/CYA': 'communities/youth-guilds/cya',
  'about/musande': 'communities/youth-guilds/musande',
  'about/Musande': 'communities/youth-guilds/musande',
  'about/agnes-alois': 'communities/youth-guilds/agnes-alois',
  'about/agnesandalois': 'communities/youth-guilds/agnes-alois',
  'about/st-peter-mary': 'communities/youth-guilds/st-peter-mary',
  'about/StPeterAndMary': 'communities/youth-guilds/st-peter-mary',
  'about/st-mary-youth': 'communities/youth-guilds/st-mary-youth',
  'about/StMaryYouth': 'communities/youth-guilds/st-mary-youth',
  
  // Choir
  'about/choir': 'communities/choir/english',
  'about/choir-shona': 'communities/choir/shona',
  'about/choirshona': 'communities/choir/shona',
  
  // Sections (Geographic)
  'sections/parachute-regiment': 'communities/sections/parachute-regiment',
  'sections/parachuteregime': 'communities/sections/parachute-regiment',
  'sections/avondale-west': 'communities/sections/avondale-west',
  'sections/avondalew': 'communities/sections/avondale-west',
  'sections/bloomingdale': 'communities/sections/bloomingdale',
  'sections/bloom': 'communities/sections/bloomingdale',
  'sections/meyrick-park': 'communities/sections/meyrick-park',
  'sections/meyrick': 'communities/sections/meyrick-park',
  'sections/cotswold-hills': 'communities/sections/cotswold-hills',
  'sections/costwold': 'communities/sections/cotswold-hills',
  'sections/mabelreign-central': 'communities/sections/mabelreign-central',
  'sections/malbereign': 'communities/sections/mabelreign-central',
  'sections/haig-park': 'communities/sections/haig-park',
  'sections/haig': 'communities/sections/haig-park',
  
  // Events
  'events/special-events': 'events/special-events',
  'events/SpecialEvents': 'events/special-events',
};

/**
 * Check if a path is a known static route
 * @param {string} path - The path to check
 * @returns {boolean}
 */
export const isKnownStaticRoute = (path) => {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return pathMappings.hasOwnProperty(normalized);
};

/**
 * Get the corrected path category for dynamic routing
 * @param {string} path - The stored page path
 * @returns {string} - The category part (e.g., 'sections', 'committees')
 */
export const getPathCategory = (path) => {
  if (!path) return null;
  
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const parts = normalized.split('/');
  
  if (parts.length >= 1) {
    return parts[0];
  }
  return null;
};

/**
 * Check if a path needs dynamic routing
 * @param {string} path - The stored page path
 * @returns {boolean}
 */
export const needsDynamicRouting = (path) => {
  if (!path) return false;
  
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  
  // Check if it's a known static route
  if (pathMappings[normalized]) return false;
  
  // Check if it starts with a known category
  const category = getPathCategory(path);
  if (category && DYNAMIC_PATTERNS[category]) return true;
  
  // If path has multiple segments (category/slug), it might be dynamic
  const parts = normalized.split('/');
  if (parts.length >= 2) return true;
  
  return false;
};

/**
 * Get the correct path for viewing a page
 * If the stored path is old, map it to the new path
 * @param {string} path - The stored page path
 * @returns {string} - The corrected path with /HolyName prefix
 */
export const getCorrectPath = (path) => {
  if (!path) return '/';
  
  // Remove leading slash if present
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Check if we have a mapping for this path
  if (pathMappings[normalizedPath]) {
    return `/${pathMappings[normalizedPath]}`;
  }

  // Also check with leading slash
  if (pathMappings[`/${normalizedPath}`]) {
    return `/${pathMappings[`/${normalizedPath}`].slice(1)}`;
  }

  // If no mapping found, assume path is already correct
  return `/${normalizedPath}`;
};

/**
 * Get just the path part without the base URL
 * @param {string} path - The stored page path
 * @returns {string} - The corrected path without base
 */
export const getCorrectPagePath = (path) => {
  if (!path) return '/';
  
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  
  if (pathMappings[normalizedPath]) {
    return `/${pathMappings[normalizedPath]}`;
  }
  
  return `/${normalizedPath}`;
};

export default { pathMappings, getCorrectPath, getCorrectPagePath, isKnownStaticRoute, getPathCategory, needsDynamicRouting };