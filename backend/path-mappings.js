// Migration script to update page paths in the database
// Run this script to update all old /about/ paths to new /communities/{category}/{slug} paths

const pathMappings = {
  // Committees
  '/about/main-gov': '/communities/committees/main-gov',
  '/about/family-apostolate': '/communities/committees/family-apostolate',
  '/about/soccom': '/communities/support-teams/soccom',
  '/about/catechesis': '/communities/support-teams/catechesis',
  '/about/ccr': '/communities/support-teams/ccr',
  '/about/youth-council': '/communities/committees/youth-council',
  '/about/YouthCouncil': '/communities/committees/youth-council',
  '/about/altar-servers': '/communities/committees/altar-servers',
  '/about/AltarServers': '/communities/committees/altar-servers',
  '/about/missionary-childhood': '/communities/committees/missionary-childhood',
  '/about/MissionaryChildhood': '/communities/committees/missionary-childhood',
  
  // Adult Guilds
  '/about/chemwoyo': '/communities/adult-guilds/chemwoyo',
  '/about/chamariya': '/communities/adult-guilds/chamariya',
  '/about/st-anne': '/communities/adult-guilds/st-anne',
  '/about/StAnne': '/communities/adult-guilds/st-anne',
  '/about/st-joachim': '/communities/adult-guilds/st-joachim',
  '/about/StJoachim': '/communities/adult-guilds/st-joachim',
  '/about/st-joseph': '/communities/adult-guilds/st-joseph',
  '/about/StJoseph': '/communities/adult-guilds/st-joseph',
  
  // Youth Guilds
  '/about/cya': '/communities/youth-guilds/cya',
  '/about/CYA': '/communities/youth-guilds/cya',
  '/about/musande': '/communities/youth-guilds/musande',
  '/about/Musande': '/communities/youth-guilds/musande',
  '/about/agnes-alois': '/communities/youth-guilds/agnes-alois',
  '/about/agnesandalois': '/communities/youth-guilds/agnes-alois',
  '/about/st-peter-mary': '/communities/youth-guilds/st-peter-mary',
  '/about/StPeterAndMary': '/communities/youth-guilds/st-peter-mary',
  '/about/st-mary-youth': '/communities/youth-guilds/st-mary-youth',
  '/about/StMaryYouth': '/communities/youth-guilds/st-mary-youth',
  
  // Choir
  '/about/choir': '/communities/choir/english',
  '/about/choir-shona': '/communities/choir/shona',
  '/about/choirshona': '/communities/choir/shona',
  
  // Sections (Geographic)
  '/sections/parachute-regiment': '/communities/sections/parachute-regiment',
  '/sections/parachuteregime': '/communities/sections/parachute-regiment',
  '/sections/avondale-west': '/communities/sections/avondale-west',
  '/sections/avondalew': '/communities/sections/avondale-west',
  '/sections/bloomingdale': '/communities/sections/bloomingdale',
  '/sections/bloom': '/communities/sections/bloomingdale',
  '/sections/meyrick-park': '/communities/sections/meyrick-park',
  '/sections/meyrick': '/communities/sections/meyrick-park',
  '/sections/cotswold-hills': '/communities/sections/cotswold-hills',
  '/sections/costwold': '/communities/sections/cotswold-hills',
  '/sections/mabelreign-central': '/communities/sections/mabelreign-central',
  '/sections/malbereign': '/communities/sections/mabelreign-central',
  '/sections/haig-park': '/communities/sections/haig-park',
  '/sections/haig': '/communities/sections/haig-park',
  
  // Events
  '/events/special-events': '/events/special-events',
  '/events/SpecialEvents': '/events/special-events',
};

module.exports = { pathMappings };

// To run this migration:
// 1. Import it in your server.js or migration script
// 2. Use it to update all pages in the database
// 
// Example usage:
// const { pathMappings } = require('./path-mappings');
// 
// // Update all pages
// const updatePages = async (db) => {
//   const updates = [];
//   for (const [oldPath, newPath] of Object.entries(pathMappings)) {
//     updates.push(
//       db.collection('pages').updateMany(
//         { path: oldPath },
//         { $set: { path: newPath } }
//       )
//     );
//   }
//   await Promise.all(updates);
//   console.log('All page paths updated!');
// };