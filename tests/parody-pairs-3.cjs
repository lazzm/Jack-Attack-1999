// Third sweep (owner, 2026-10-27): space missions, craft, agencies, stations, near-real brands, real small towns, and the
// Zeldo series rename. [category, real, parody]. `P` = case-insensitive whole-word pairs (like pairs 1 and 2);
// `P.cs` = CASE-SENSITIVE exact-token pairs for short or common words (Mir, ISS, Discovery, Eagle...) so lowercase ids,
// CSS class names and ordinary words are never touched. Tokens never match next to a letter, digit, "_" or "-".
// Table: docs/PARODY-NAMES.md ("Third sweep").
const P = [];
const add = (cat, list) => list.forEach(([a, b]) => P.push([cat, a, b]));
const CS = [];
const addCs = (cat, list) => list.forEach(([a, b]) => CS.push([cat, a, b]));

add('Zeldo series rename', [
 ['The Legend of Zeldoo','The Myth of Zeldo'],['The Legend of Zeldo','The Myth of Zeldo'],['Legend of Zeldo','Myth of Zeldo'],['Legend of Zelda','Myth of Zeldo'],
]);

add('Space missions, craft and agencies', [
 ['International Space Stations','International Space Stationeries'],['International Space Station','International Space Stationery'],
 ['Space Shuttles','Space Shuttlebuses'],['Space Shuttle','Space Shuttlebus'],
 ['Mars Polar Lander','Mars Polar Landlord'],['Mars Climate Orbiter','Mars Climate Orbiteer'],['Mars Global Surveyor','Mars Global Surfer'],
 ['Mars Pathfinder','Mars Pathfinger'],['Pathfinder','Pathfinger'],['Sojourner Truth','Sojourney Truth'],['Sojourner','Sojourney'],
 ['Deep Space 1','Deep Space Won'],['Deep Space 2','Deep Space Too'],['Amundsen and Scott','Amundsend and Scotty'],
 ['Lunar Prospector','Lunar Prospectus'],['Apollo','Apolly'],['Sputnik','Spudnik'],['Vostok','Vostock'],['Soyuz','Soyuse'],
 ['Skylab','Skylabrador'],['Voyager','Boyager'],['Cassini','Cassiny'],['Chandra','Chandruff'],['Landsat','Landsnap'],
 ['Shenzhou','Shenzoo'],['Mariner 10','Marinade 10'],['Venera','Venerable'],['Magellan probe','Magellam probe'],['Arecibo','Arecibow'],
 ['Saturn V','Saturn Vee'],['Gemini 8','Gemony 8'],['Pioneer 11','Pioneered 11'],['Explorer 1','Exploder 1'],
 ['Ariane 5','Arianna 5'],['Proton rocket','Protein rocket'],['Delta II','Delta Too'],['Zarya','Zaryer'],
['STS-103','STX-103'],['STS-96','STX-96'],['STS-93','STX-93'],['X-15','X-16'],
 ['NASA','NASSA'],['Hermes Conrad','Hermes Conrod'],
]);

add('Near-real brands and towns', [
 ['Fergusson','Fergusnot'],['Grimsby','Grimsbyte'],['Hackney','Hackneigh'],['Slough','Sluff'],['Weston-super-Mare','Weston-super-Mayo'],
 ['Aldershot','Aldershoe'],['Mars bar','Marsh bar'],['Ceefax','Ceefacts'],['Wikipedia','Wikipeedia'],
]);

addCs('Shuttles, stations, lander and probes (exact case)', [
 ['Columbia','Columbun'],['COLUMBIA','COLUMBUN'],['Columbia, Discovery, Atlantis, Endeavour','Columbun, Dishcovery, Atlantiss, Endeavower'],
 ['Discovery','Dishcovery'],['DISCOVERY','DISHCOVERY'],['Endeavour','Endeavower'],['ENDEAVOUR','ENDEAVOWER'],
 [']] Atlantis',']] Atlantiss'],['orbiter Challenger','orbiter Chancer'],
 ['Mir','Mirth'],['MIR','MIRTH'],['ISS','ISSY'],['Unity','Unitea'],['UNITY','UNITEA'],['ZARYA','ZARYER'],['Stardust','Stardusty'],['XMM','XMN'],
 ['Ariane','Arianna'],['Collins','Collinz'],
 ['The Eagle has landed','The Seagull has landed'],['Eagle','Seagull'],['Eagle eye','Eagle eye'],['Eagle eyes','Eagle eyes'],
]);

P.cs = CS;
module.exports = P;
