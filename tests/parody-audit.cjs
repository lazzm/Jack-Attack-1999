/* Authored prose only. Run with node --expose-internals. --write is a mechanical source rewrite. */
'use strict';
const fs=require('fs'),path=require('path'),acorn=require('internal/deps/acorn/acorn/dist/acorn');
const ROOT=path.resolve(__dirname,'../app');
const pairs=[
 ['The Legend of Zelda','The Legend of Zeldoo'],['Ocarina of Time','Kazoo of Time'],['Super Mario 64','Super Marlo 64'],['Mario Kart 64','Kart Kaos 64'],['Mario Kart','Kart Kaos'],['Super Mario','Super Marlo'],['Mario','Marlo'],['Luigi','Louie G'],['Bowser','Bouncer'],['Yoshi','Yosher'],
 ['Banjo-Kazooie','Backpack Buddies'],['Banjo-Tooie','Backpack Buddies Too'],['Diddy Kong Racing','Dinky Donk Racing'],['Diddy Kong','Dinky Donk'],['Donkey Kong','Donkey Wrong'],['Jet Force Gemini','Jet Pack Twins'],['Conker','Acorn Quest'],
 ['GoldenEye','Goldenballs'],['Perfect Dark','Imperfect Dark'],['Crash Bandicoot','Warp Wombat'],['Spyro','Spike the Stegosaur'],['Sonic Adventure','Zip Adventure'],['Sonic','Zip'],['F-Zero','Formula Null'],['Wipeout','Hover Havoc'],['Street Fighter','Street Frightener'],['Tekken','Iron Fist'],['Mortal Kombat','Immortal Combat'],['Resident Evil','Resident Weevil'],['Tomb Raider','Crypt Raider'],['Lara Croft','Clara Loft'],
 ['Half-Life','Half-Loaf'],['Unreal Tournament','Jackreal Tournament'],['Unreal','Jackreal'],['Quake','Jaquake'],['Doom','Gloom'],['Diablo','Diabolo'],['Warcraft','Waaaghcraft'],['StarCraft','StarGraft'],['Command & Conquer','Command & Confuse'],['Command and Conquer','Command and Confuse'],['Age of Empires','Age of Emperors'],['SimCity','Civic Chaos'],['Theme Park','Park Panic'],['RollerCoaster Tycoon','RollerCoaster Rupeecoon'],['Dungeon Keeper','Dungeon Keepa'],['Grand Theft Auto','Grand Theft Otter'],['Metal Gear Solid','Metal Gear Wobbly'],['Gran Turismo','Grand Tourismo'],
 ['Pok&eacute;mon','Pocket Critters'],['Pok&#233;mon','Pocket Critters'],['Pokémon','Pocket Critters'],['Pokemon','Pocket Critters'],['Pikachu','Zapachu'],['Bulbasaur','Bulbabeast'],['Charmander','Charbroiler'],['Squirtle','Squirturtle'],['Mewtwo','MewToo'],['Alakazam','Alakabam'],['Tetris','Blockology'],['Rubik','Rubrick'],['LEGO','Blocko'],['Tamagotchi','Eggbert'],['Tamagotchis','Eggberts'],
 ['Super Nintendo','Super Ultra'],['Nintendo 64','Ultra 64'],['NINTENDO64','Ultra 64'],['N64','Ultra 64'],['Game Boy Color','Game Lad Color'],['Game Boy','Game Lad'],['PlayStation','PlaySpace'],['Dreamcast','Daydream'],['Mega Drive','Mega Glide'],['Sega Saturn','Segue Orbiter'],['Nintendo','Ultra Entertainment'],['Sega','Segue'],['Sony','Somy'],['Microsoft','Jacksoft'],['Windows','JackOS'],['MS-DOS','JACK-DOS'],['Nokia','Talkbrik'],['Ericsson','ErrorSon'],['Motorola','Motoroller'],
 ['Star Wars','Intergalactic Battles'],['Star Trek','Galaxy Walk'],['The Phantom Menace','The Phantom Nuisance'],['A New Hope','An Old Hope'],['The Empire Strikes Back','The Empire Strikes Out'],['Return of the Jedi','Return of the Space Cadets'],['Luke Skywalker','Luke Skywobbler'],['Anakin Skywalker','Anklekin Skywobbler'],['Obi-Wan Kenobi','Obi-Wan Cannoli'],['Obi Wan Kenobi','Obi Wan Cannoli'],['Qui-Gon Jinn','Qui-Gon Gym'],['Darth Vader','Dark Vapour'],['Darth Maul','Dark Mole'],['Jar Jar Binks','Jar Jar Jams'],['Jar Jar','Jar Jar Jams'],['Han Solo','Ham Solo'],['Chewbacca','Chew Biscuit'],['Millennium Falcon','Millennium Pigeon'],['Tatooine','Tattyween'],['Death Star','Dread Scone'],['Yoda','Yoga'],['Jedi','Space Cadet'],['Sith','Sulk'],['lightsaber','lightspatula'],['George Lucas','Gordon Lukewarm'],['LucasArts','Lukewarm Arts'],['Lucasfilm','Lukewarm Films'],
 ['The Matrix','The Modemtrix'],['Red Dwarf','Red Dork'],['Doctor Who','Doctor Whoops'],['Jurassic Park','Jurassic Lark'],['Toy Story','Toy Storey'],['Terminator','Terminatater'],['Back to the Future','Back to the Furniture'],['Indiana Jones','Indiana Groans'],['RoboCop','Robot Cop-Out'],['The Simpsons','The Simpsocks'],['South Park','South Playground'],['The X-Files','The X-Folders'],['X-Files','X-Folders'],['Buffy the Vampire Slayer','Biffy the Vampire Player'],['Robot Wars','Robo Rumble'],['Warhammer','War Hamster'],['Games Workshop','Games Worktop'],['Orks','Gorks'],
 ['Outlook Express','JackMail Express'],['Internet Explorer','JackNet Explorer'],['Netscape Navigator','NetScapeGoat Navigator'],['Netscape','NetScapeGoat'],['Ask Jeeves','Ask Gubbinz'],['Yahoo!','WAAAGHoo!'],['AltaVista','AltaGrotsta'],['Hotmail','HotGrot Mail'],['GeoCities','GrotCities'],['AOL','LOL Online'],['WinZip','JackZip'],['Winamp','Jackamp'],['RealPlayer','ReelPlayer'],['QuickTime','QuickThyme'],['Panini','Panino'],['Airfix','AirMix'],['Coca-Cola','Cocoa-Cola'],['Pepsi','Pepzi'],['McDonalds','McDoodles'],['McDonald','McDoodle'],['Burger King','Burger Duke'],['Adidas','Adidots']
];
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// One pass prevents replacements being re-parodied (e.g. Jackreal -> JackJackreal).
const lookup=new Map(pairs.map(([a,b])=>[a.toLowerCase(),b]));
for(const[,b]of pairs)if(!lookup.has(b.toLowerCase()))lookup.set(b.toLowerCase(),b);
const re=new RegExp('(?<![\\p{L}\\p{N}_])(?:'+[...lookup.keys()].sort((a,b)=>b.length-a.length).map(esc).join('|')+')(?![\\p{L}\\p{N}_])','giu');
function words(s){return s.replace(re,m=>{if(m==='theme park')return m;const b=lookup.get(m.toLowerCase());if(m.toLowerCase()===b.toLowerCase())return m;return m===m.toUpperCase()?b.toUpperCase():m===m.toLowerCase()?b.toLowerCase():b}).replace(/\bRare(?=\s+(?:game|studio|develop))|(?<=\bby )Rare\b/g,'Oddware')}
function prose(s){return s.split(/(<[^>]*>)/g).map((part,i)=>i%2?part.replace(/\b(title|alt|aria-label)=("[^"]*"|'[^']*')/g,(_m,k,v)=>k+'='+words(v)):words(part)).join('')}
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=[...walk(path.join(ROOT,'public/js')),...walk(path.join(ROOT,'mods')),path.join(ROOT,'server.js'),path.join(ROOT,'public/index.html')].filter(f=>/\.(js|html)$/.test(f)&&!/(?:vendor|three\.min|licenses?)/i.test(f));
let changed=0,editsTotal=0;
for(const file of files){const src=fs.readFileSync(file,'utf8'),edits=[];
 if(file.endsWith('.html')){const out=prose(src);if(out!==src)edits.push({a:0,b:src.length,v:out})}
 else{const ast=acorn.parse(src,{ecmaVersion:'latest',sourceType:'script',allowReturnOutsideFunction:true});
  function visit(n,parent,key){if(!n||typeof n!=='object')return;
   let a,b;
   if(n.type==='Literal'&&typeof n.value==='string'){a=n.start+1;b=n.end-1;if(parent?.type==='Property'&&key==='key')return;if(['id','key','slug','icon','img','href','url','path'].includes(parent?.key?.name||parent?.key?.value))return;}
   else if(n.type==='TemplateElement'){a=n.start;b=n.end;}
   if(a!=null){const raw=src.slice(a,b);if(/^[a-z0-9_.\/#:-]+$/.test(raw)||/^(?:https?:\/\/|(?:\.\.\/)?(?:js|css|fonts|images)\/)|\.(?:js|css|png|svg|jpg|woff2?|gif|webp|mp3|ogg)$/i.test(raw)||/MS Sans Serif|Microsoft Sans Serif|userAgent|[A-Z]:[\\/]/.test(raw))return;const out=prose(raw);if(out!==raw)edits.push({a,b,v:out});return;}
   for(const[k,v]of Object.entries(n)){if(k==='start'||k==='end')continue;if(Array.isArray(v))v.forEach(x=>visit(x,n,k));else if(v&&typeof v==='object')visit(v,n,k)}
  }visit(ast,null,'');
 }
 if(!edits.length)continue;let out=src;for(const e of edits.sort((a,b)=>b.a-a.a))out=out.slice(0,e.a)+e.v+out.slice(e.b);
 changed++;editsTotal+=edits.length;if(process.argv.includes('--write'))fs.writeFileSync(file,out);console.log(path.relative(ROOT,file),edits.length);if(process.argv.includes('--details'))for(const e of edits)console.log(JSON.stringify({from:src.slice(e.a,e.b).slice(0,200),to:e.v.slice(0,200)}));
}
console.log(`${process.argv.includes('--write')?'Rewrote':'Would rewrite'} ${editsTotal} authored text spans in ${changed} files; IDs/keys, asset paths, regexes, vendor files and live user data excluded.`);
