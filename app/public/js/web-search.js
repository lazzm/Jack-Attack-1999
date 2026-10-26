/* web-search: JackSearch, the 1999 search engine (www.jacksearch.find) and its web directory (/dir/).
 * Indexes every hidden page in the 1999 Web, the other packs' hidden pages and the main JACK ATTACK! sections. */
(function () {
  const W = window.WebPack, esc = W.esc, tile = W.tile, M = W.M;
  const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // the other hidden pages on this computer (made by other packs), so the engine finds them too
  const OTHER = { webring: ['The Nerd Kids WebRing', 'Hub of the OTHER webring. UFOs, bunkers, dancing robots and Dave.', 'comm'], area51: ['The Truth Is On This Website', 'UFO sightings, blurry photos and a thumb.', 'weird'], y2kbunker: ["Jack's Y2K Bunker", 'Millennium Bug survival guide. Beans.', 'weird'], cubeclub: ['The Cube Club', 'Solve the cube layer by layer, with the moves written out.', 'hobby'], tetris: ['Shrine of the Falling Blocks', "Jack's Blockology shrine.", 'fans'], grotdance: ['The Gubbinz Dance', 'Twelve dancing Gubbinzes and a tune.', 'fun'], hamsterdance: ['Do The Blobbit Dance', 'Thirty-two dancing Blobbits. Even more of it.', 'fun'], gubbinzhome: ["Gubbinz's 'Omepage", 'Written by Gubbinz. Spelling may vary.', 'mates'], dave: ["Dave's Kool Page (the OLD one)", 'Yellow. Comic Sans. Goldenballs claims.', 'mates'], matrix: ['Wake Up', 'Something weird with falling green letters.', 'weird'], konami: ['The Code', 'Up, up, down, down...', 'games'], netscape: ['Wrong Browser!', "You're using the wrong browser (you're not).", 'help'], bsod: ['The Hall of Famous Crashes', 'Famous crashes and a free one.', 'sci'], credits: ['The Credits', 'Who made all this.', 'help'], underconstruction: ['Under Construction', 'Coming soon!!! (forever)', 'weird'], oldsite: ["Jack's Home Page (1999 edition)", 'The old version of the site.', 'weird'], secret: ['There Is No Secret Page', 'There is no secret page.', 'hidden'], admin: ['JackNet Admin Login', 'Staff only. NO ENTRY. (Try anyway.)', 'hidden'], jackamp: ['JackAmp on the Web', 'The best MIDI player in the world.', 'fun'], hklm: ['HKEY_LOCAL_MACHINE', 'The registry, on the web, for some reason.', 'sci'], keepoutdave: ['KEEP OUT DAVE', 'A page Dave is not allowed on.', 'hidden'] };
  const MAIN = { home: ['JACK ATTACK! Online', 'The front page of the games mag Jack made.', 'news'], demos: ['Games Arcade', 'Play games: Jacktris, Blobbit Lob, the MegaCube and more.', 'games'], grot: ['Gubbinz Pet', "Jack's virtual pet Gubbinz. Feed him. Poke him.", 'fun'], saver: ['Screensaver', 'Download the screensaver (and change the wallpaper).', 'fun'], reviews: ['Reviews', 'Game reviews by Jack. Marks out of 100.', 'games'], cheats: ['Cheats', 'Real cheats for the games on this site.', 'games'], orks: ['Hobby Corner', "Painting minis, model kits, BLOCKO and Jack's Gorks. Painted. Loved.", 'hobby'], letters: ['Letters', 'Write to Jack. He replies to everyone.', 'comm'], art: ['Art Wall', 'Draw on the shared wall with everyone.', 'fun'], chat: ['Chat Room', 'The main chat room. Live.', 'comm'], forums: ['Forums', 'JackNet BBS. Threads about everything.', 'comm'], members: ['Members', 'Everyone who has joined JackNet.', 'comm'] };
  let INDEX = null, building = null;
  const LINKS = raw => (window.WebDir && WebDir.linksOf ? WebDir.linksOf(raw) : []);
  const strip = h => { const d = document.createElement('div'); d.innerHTML = String(h).replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<(br|\/p|\/div|\/li|\/td|\/th|\/h\d|\/option|\/a|\/span|\/b|\/tr|\/label)\b[^>]*>/gi, '$& '); return d.textContent.replace(/\s+/g, ' ').trim(); };
  function build() {
    if (INDEX) return Promise.resolve(INDEX);
    return building = building || W.loadAll().catch(() => 0).then(() => {
      const ix = [];
      for (const w of Object.keys(M)) {
        const m = M[w]; if (m.cat === 'hidden' || (m.parent && M[m.parent].cat === 'hidden')) continue;
        let text = '', out = []; const def = W.defs[w];
        if (def) { try { const raw = def.html(W.stubCtx(w)); text = strip(raw); out = LINKS(raw); } catch (e) { text = ''; } }
        ix.push({ w, kind: 'web', sub: !!m.parent, title: m.t, url: W.urlOfWord(w), desc: m.d, cat: m.parent ? M[m.parent].cat : m.cat, text: fold(m.t + ' ' + m.d + ' ' + text), body: text.slice(0, 5000), out, size: Math.round(3 + text.length / 90) });
      }
      for (const w of Object.keys(OTHER)) ix.push({ w, kind: 'other', title: OTHER[w][0], url: 'http://' + 'www.jackattack.jnet' + '/' + w, desc: OTHER[w][1], cat: OTHER[w][2], text: fold(OTHER[w].join(' ') + ' ' + w), size: 4 + w.length });
      for (const s of Object.keys(MAIN)) { const el = document.querySelector('.sec[data-sec="' + s + '"]'); const t = el ? el.textContent.replace(/\s+/g, ' ').slice(0, 6000) : ''; ix.push({ w: s, kind: 'main', title: 'JACK ATTACK! - ' + MAIN[s][0], url: 'http://' + 'www.jackattack.jnet' + '/' + (s === 'home' ? '' : '#' + s), desc: MAIN[s][1], cat: MAIN[s][2], text: fold(MAIN[s].join(' ') + ' ' + t), body: t.slice(0, 5000), size: 8 + Math.round(t.length / 120) }); }
      // every other site on the JackNet (IE.addSite) and Jack's own pages, read by WebDir (js/web-engines.js)
      if (window.WebDir && WebDir.siteDocs) { try { ix.push(...WebDir.siteDocs(ix)); } catch (e) { console.error(e); } }
      return (INDEX = ix);
    });
  }
  function search(q) {
    const terms = fold(q).split(/[^a-z0-9~']+/).filter(Boolean).slice(0, 8); if (!terms.length) return [];
    const out = [];
    for (const e of INDEX) {
      let score = 0; const tt = fold(e.title), ww = fold(e.w);
      for (const t of terms) { const n = e.text.split(t).length - 1; if (!n && !tt.includes(t) && !ww.includes(t)) { score = -1; break; } score += Math.min(n, 12) + (tt.includes(t) ? 15 : 0) + (ww === t || ww === '~' + t ? 25 : 0); }
      if (score >= 0) { const i = e.text.indexOf(terms[0]); out.push({ e, score, snip: e.text.slice(Math.max(0, i - 60), i + 110) }); }
    }
    return out.sort((a, b) => b.score - a.score);
  }
  const open = e => { if (e.kind === 'main') { document.getElementById('browser').classList.remove('min'); IE.go(e.w, 'click'); } else if (e.kind === 'site') { document.getElementById('browser').classList.remove('min'); IE.navigate(e.url); } else W.go(e.w); };
  W.searchApi = { build, search, open, get index() { return INDEX; } };
  const CATS = W.CATS;
  // the old, cluttered, navy-and-gold engine of 1999 (it was the biggest, once. Last year.)
  const spider = '<svg class="gs-spi" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4v8M3 3l3 3M13 3l-3 3M2 8h4M14 8h-4M3 13l3-3M13 13l-3-3" stroke="#ffd400" stroke-width="1.3" fill="none"/><ellipse cx="8" cy="8" rx="2.6" ry="3.2" fill="#ffd400"/><circle cx="7" cy="6.6" r=".7" fill="#e10600"/><circle cx="9" cy="6.6" r=".7" fill="#e10600"/></svg>';
  const logoHtml = big => `<span class="gs-logo${big ? ' big' : ''}">${spider}<b>JACK</b><i>SEARCH</i></span>`;
  // the "Pirate" results language (its internal id is still 'ork', from before)
  const ORK = { the: "th'", you: 'ye', your: 'yer', is: 'be', are: 'be', am: 'be', my: 'me', hello: 'ahoy', hi: 'ahoy', yes: 'aye', friend: 'matey', friends: 'hearties', good: 'shipshape', very: 'mighty', think: 'reckon', nothing: 'naught', money: 'doubloons', pounds: 'doubloons', rupees: 'doubloons', computer: 'magic box', computers: 'magic boxes', page: 'scroll', website: 'treasure map', homepage: 'ship', and: "an'", of: "o'", boy: 'lad', boys: 'lads', girl: 'lass', small: 'wee', little: 'wee', fight: 'duel', win: 'plunder', stop: 'avast', look: 'spy', where: 'whar', over: "o'er", for: 'fer', to: "t'", here: "'ere", have: "'ave", hamster: 'parrot', hamsters: 'parrots', dog: 'sea dog', cat: 'ship\'s cat', mom: 'the Cap\'n', modem: 'squawkin\' box', game: 'adventure', games: 'adventures', cheats: 'secret charts' };
  const orkify = h => String(h).replace(/(<[^>]*>)|([A-Za-z']+)/g, (m, tag, w) => { if (tag) return tag; const r = ORK[w.toLowerCase()]; if (!r) return w; return w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase() ? r[0].toUpperCase() + r.slice(1) : r; });
  const piglatin = h => String(h).replace(/(<[^>]*>)|([A-Za-z]{2,})/g, (m, tag, w) => tag || (/^[aeiou]/i.test(w) ? w + 'way' : w.replace(/^([^aeiouAEIOU]+)(.*)$/, '$2$1ay')));
  const grotify = h => String(h).replace(/(<[^>]*>|&#?[a-zA-Z0-9]+;)|([.!?])|([a-z]+)/g, (m, tag, p, w) => tag || (p ? (p === '.' ? '. BEEP.' : p) : w.toUpperCase())); // the "Robot" language (id 'grot')
  const LANG = { any: x => x, en: x => x, ork: orkify, grot: grotify, pig: piglatin };
  const HOT = ['hamster', 'cheats', 'critters', 'millennium bug', 'phantom menace', 'rupees', 'dave', 'goldenballs', 'free e-mail', 'midi'];
  const CSS = `.wp-search,.wp-directory{background:#fff;color:#000;font:13px/1.4 Arial,Helvetica,sans-serif;padding-top:10px}
.gs-bar{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;background:linear-gradient(#000080,#000050);border-bottom:3px solid #ffd400;padding:6px 10px;margin:0 -18px 0}
.gs-logo{display:inline-flex;align-items:center;gap:4px;font:bold 26px Georgia,"Times New Roman",serif;letter-spacing:2px;line-height:1}.gs-logo b{color:#ffd400;font-weight:bold}.gs-logo i{color:#fff;font-style:normal;font-weight:normal}
.gs-logo .gs-spi{width:26px;height:26px}.gs-logo.big{font-size:34px}.gs-logo.big .gs-spi{width:34px;height:34px}
.gs-tag{color:#c8c8ff;font:italic 11px Georgia,serif}
.gs-barl{margin-left:auto;font-size:11px;color:#ffd400}.gs-barl a{color:#fff!important}
.gs-tabs{display:flex;flex-wrap:wrap;gap:2px;margin:0 -18px 0;padding:4px 10px 0;background:#d8d8ec;border-bottom:1px solid #000080;font-size:12px}
.gs-tabs a,.gs-tabs b{padding:3px 10px;border:1px solid #000080;border-bottom:0;background:#eef;color:#000080!important;text-decoration:none!important}.gs-tabs b{background:#fff;position:relative;top:1px}
.gs-form{background:#f0f0fa;border:1px solid #000080;border-top:0;padding:8px 10px;margin:0 0 8px}
.gs-row1{display:flex;align-items:center;gap:5px;flex-wrap:wrap;font-weight:bold;color:#000080}
.gs-row1 input[type=text]{width:260px;max-width:100%;font:13px Arial,sans-serif;padding:2px 3px;flex:1 1 180px}
.gs-row1 select{font:12px Arial,sans-serif}.gs-form .btn{font-size:12px}
.gs-row2{font-size:11px;margin-top:6px;color:#333}.gs-row2 b{color:#080}
.gs-ff{background:#ffffd0;border:1px solid #c9a200;padding:0 4px}
.gs-adv{margin-top:8px;border-top:1px dashed #000080;padding-top:6px;font-size:12px}.gs-adv textarea{width:100%;box-sizing:border-box;height:46px;font:12px "Courier New",monospace}
.gs-adv .gs-ar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:4px}.gs-adv input{width:70px;font:12px Arial,sans-serif}
.gs-home table{width:100%;border-collapse:collapse;margin:6px 0}.gs-home td{vertical-align:top;padding:4px 8px;border:1px solid #c8c8e8;font-size:12px;width:33%}
.gs-home h4{margin:0 0 4px;background:#000080;color:#ffd400;font:bold 12px Arial,sans-serif;padding:2px 6px;margin:-4px -8px 6px}
.gs-tips{font-size:11px;color:#555;margin:4px 0}
.gs-stats{background:#000080;color:#fff;padding:4px 8px;font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px}.gs-stats b{color:#ffd400}
.gs-wc{font-size:11px;color:#555;margin:4px 0 8px}
.gs-res{margin:12px 0;padding-left:22px;position:relative}.gs-num{position:absolute;left:0;top:1px;font-weight:bold;color:#000080}
.gs-res a.gs-t{font-size:15px;font-weight:bold;color:#00c}
.gs-res .gs-u{color:#080;font-size:11px;word-break:break-all}
.gs-res .gs-s{color:#222;font-size:12px}.gs-res .gs-s b{color:#000;background:#ffffa0}
.gs-res .gs-m{color:#666;font-size:11px}.gs-res .gs-m a{color:#000080}
.gs-pages{text-align:center;margin:14px 0;font-size:13px}.gs-pages a{margin:0 4px;color:#00c}.gs-pages b{margin:0 4px;color:#000080;border:1px solid #000080;padding:0 4px}
.gs-dir{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px 20px;margin:10px 0}
.gs-dir b a{font-size:15px;color:#000080}.gs-dir .small a{color:#080}
.gs-cat h2{font:bold 20px Georgia,serif;color:#000080;margin:8px 0}
.gs-cat .gs-res{border-bottom:1px dotted #ccc;padding-bottom:8px;padding-left:0}
.gs-none{background:#fff8e0;border:1px solid #c9a200;padding:10px;margin:12px 0}
.gs-foot{text-align:center;color:#777;font-size:11px;margin-top:20px;border-top:1px solid #000080;padding-top:6px}
.wp-directory .gs-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#000080;margin:0 -18px 8px;padding:6px 10px;color:#ffd400}.wp-directory .gs-top b{color:#fff}.wp-directory .gs-top .gs-form{background:none;border:0;padding:0;margin:0 0 0 auto;display:flex;gap:4px}
.gs-small .gs-tips{display:none}
@media (max-width:600px){.gs-bar,.gs-tabs{margin:0 -10px}.gs-home td{display:block;width:auto}.gs-logo{font-size:22px}.gs-barl{margin-left:0}}`;

  // ---------------------------------------------------------------- the search page
  W.def('search', {
    css: CSS,
    html: c => `<div class="gs-bar">${logoHtml(true)}<span class="gs-tag">The search engine. Since 1999.</span><span class="gs-barl"><a href="#" class="gs-advt">Advanced Search</a> | ${c.a('directory', 'Directory')} | <a href="#" class="gs-help">Help</a> | <a href="#" class="gs-about">About</a></span></div>
<div class="gs-tabs"><b>Web Pages</b>${c.a('directory', 'Directory')}${c.a('news', 'News')}<a href="#" class="gs-img">Images</a>${c.a('orktranslate', 'Translate')}${c.a('jackmail', 'Free E-mail')}</div>
<form class="gs-form" autocomplete="off"><div class="gs-row1"><span>Search</span><select class="gs-where" aria-label="Search where"><option value="web">the Web</option><option value="jack">JACK ATTACK! only</option><option value="dir">the Directory</option><option value="ham">Hamsters</option></select><span>for</span><input type="text" maxlength="80" aria-label="Search the web"><span>in</span><select class="gs-lang" aria-label="Language"><option value="any">any language</option><option value="en">English</option><option value="ork">Pirate</option><option value="grot">Robot</option><option value="pig">Pig Latin</option></select><button class="btn" type="submit">Search</button><button class="btn gs-lucky" type="button">I'm Feeling Jammy</button></div>
<div class="gs-row2"><span class="gs-ff">Family Filter is <b>ON</b> (set by Mom) [<a href="#" class="gs-ffc">change</a>]</span> &middot; <a href="#" class="gs-advt">Advanced Search</a> &middot; Searching <b class="gs-n">?</b> pages</div>
<div class="gs-adv" hidden><b>Advanced Search.</b> Type a Boolean expression, like <code>hamster AND NOT dave</code>:<textarea aria-label="Boolean query"></textarea><div class="gs-ar">Sort by: <input type="text" value="best first" aria-label="Sort by"> From: <input type="text" value="01/01/99" aria-label="From date"> To: <input type="text" value="31/12/99" aria-label="To date"><button class="btn gs-advgo" type="button">Search</button><span class="small">(The dates do nothing. The spiders only know about 1999.)</span></div></div></form>
<div class="gs-home"><p class="gs-tips"><b>Tip:</b> put <b>+</b> in front of a word you MUST have and <b>-</b> in front of a word you don't want, like <i>+hamster -dave</i>. Spiders crawled <b>every</b> page last night.</p>
<table><tr><td><h4>HOT SEARCHES TODAY</h4>${HOT.map(h => `<a href="#" data-q="${h}">${h}</a>`).join('<br>')}</td><td><h4>WEB DIRECTORY</h4>${Object.keys(CATS).filter(k => k !== 'hidden').map(k => `<a href="#" data-dcat="${k}">${esc(CATS[k])}</a>`).join('<br>')}</td><td><h4>ALSO ON JACKSEARCH</h4>${c.a('orktranslate', 'Translate a page into Pirate')}<br>${c.a('jackmail', 'Free E-mail (2 MB!)')}<br>${c.a('biscuitring', 'Join a Webring')}<br>${c.a('news', 'JackNet News')}<br>${c.a('csotd', 'Cool Site of the Day')}<br>${c.a('hoods', 'Free Homepages')}<br>${c.a('teef', 'Shopping (Rupees only)')}<p class="small" style="margin:8px 0 0">New! JackSearch now in <b>Pirate</b> and <b>Robot</b>. Pick one from the language box.</p></td></tr></table></div>
<div class="gs-out"></div>
<div class="gs-foot">JackSearch is run by Gubbinz from a shoebox. Spiders crawl the web every night (they are real spiders, he keeps them in the shoebox). &copy;1999. Searches so far: <b class="gs-total">?</b><br>Rumour of the week: some new engine from a garage is "faster". Pah. JackSearch has <b>more buttons</b>.</div>`,
    setup(el, c) {
      // the logo bar goes right at the top; the sponsor's banner sits under the search box (like the big engines do it)
      const bar = el.querySelector('.gs-bar'), nav1 = el.querySelector('.wtn'), form0 = el.querySelector('.gs-form'), ad0 = el.querySelector('.wad'), cap0 = el.querySelector('.wad-cap');
      if (bar && nav1 && (nav1.compareDocumentPosition(bar) & 4)) nav1.remove();
      if (form0 && ad0 && (ad0.compareDocumentPosition(form0) & 4)) form0.after(...[ad0, cap0].filter(Boolean));
      const inp = el.querySelector('.gs-row1 input'), out = el.querySelector('.gs-out'), home = el.querySelector('.gs-home'), nEl = el.querySelector('.gs-n'), where = el.querySelector('.gs-where'), lang = el.querySelector('.gs-lang');
      const tot = el.querySelector('.gs-total'); const showT = v => { if (typeof v === 'number') tot.textContent = v.toLocaleString('en-GB'); }; c.get(['web.search.n']).then(v => showT(v['web.search.n'] || 0)); c.watch('web.search.n', ev => { if (ev.type === 'set') showT(ev.v); });
      const ready = () => (window.WebDir ? WebDir.ready() : build());
      const find = q => (window.WebDir ? WebDir.rank(INDEX, q, 'grot').hits : search(q));
      out.innerHTML = '<p class="c small">Loading the index... (the spiders are busy)</p>';
      ready().then(ix => { nEl.textContent = ix.length.toLocaleString('en-GB'); out.innerHTML = ''; if (W.pendingQuery) { inp.value = W.pendingQuery; W.pendingQuery = ''; run(1); } });
      const PER = 10;
      let lastQ = '';
      function run(page, qq) {
        let q = (qq != null ? qq : inp.value).trim(); if (!q) return; lastQ = q; const t0 = performance.now();
        if (where.value === 'dir') { W.pendingQuery = ''; W.go('directory'); return; }
        if (where.value === 'jack') q += ' site:jackattack.jnet';
        if (where.value === 'ham') q += ' hamster';
        ready().then(() => {
          if (window.WebDir && WebDir.RUDE.test(q)) { home.hidden = true; out.innerHTML = `<div class="gs-none"><b>The Family Filter (set by Mom) has hidden every result for that search.</b><br>Mom says: search for something nice. Like hamsters.</div>`; return; }
          const hits = find(q), n = hits.length, p = Math.max(1, Math.min(page, Math.ceil(n / PER) || 1)), slice = hits.slice((p - 1) * PER, p * PER), L = LANG[lang.value] || LANG.any;
          home.hidden = true;
          const terms = /related:/.test(q) ? [] : fold(q).replace(/site:\S+/, ' ').split(/[^a-z0-9~']+/).filter(Boolean);
          const hl = s => { let h = esc(s); terms.forEach(t => { h = h.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<b>$1</b>'); }); return h; };
          const wc = terms.slice(0, 5).map(t => `${esc(t)}: ${INDEX.reduce((s, e) => s + e.text.split(t).length - 1, 0).toLocaleString('en-GB')}`).join('; ');
          const mod = e => { const h = hash(e.url); return String(1 + h % 28).padStart(2, '0') + '/' + String(1 + (h >>> 5) % Math.max(1, Math.min(12, WebPack.today ? +WebPack.today().slice(3, 5) : 12))).padStart(2, '0') + '/99'; };
          out.innerHTML = `<div class="gs-stats"><span>JackSearch found <b>${n.toLocaleString('en-GB')}</b> Web page${n === 1 ? '' : 's'} for you.</span><span>Showing ${n ? (p - 1) * PER + 1 : 0} - ${Math.min(n, p * PER)}. Search took ${((performance.now() - t0) / 1000 + 0.31).toFixed(2)} seconds.</span></div>${wc ? `<div class="gs-wc">Word count: ${wc}</div>` : ''}` +
            (n ? slice.map((h, i) => `<div class="gs-res"><span class="gs-num">${(p - 1) * PER + i + 1}.</span><a href="#" class="gs-t" data-r="${esc(h.e.w)}" data-k="${h.e.kind}">${esc(h.e.title)}</a><div class="gs-s">${L(hl(h.e.desc || ''))} ${h.snip ? '...' + L(h.snip.replace(/^\.\.\.|\.\.\.$/g, '')) + '...' : ''}</div><div class="gs-u">URL: ${esc(h.e.url.replace(/^http:\/\//, ''))}</div><div class="gs-m">Last modified ${mod(h.e)} - page size ${h.e.size}K - in ${lang.value === 'ork' ? 'Pirate' : lang.value === 'grot' ? 'Robot' : 'English'} [ <a href="#" data-tr="${i}">Translate</a> ] &middot; <a href="#" data-rel="${esc(h.e.url)}">Related pages</a> &middot; <a href="#" data-sim="${esc(h.e.cat)}">More like this</a></div></div>`).join('')
              : `<div class="gs-none"><b>No documents match the query.</b><br>Suggestions:<ul><li>Make sure all words are spelled correctly. (Dave can't.)</li><li>Try different keywords, like "pocket critters" or "hamster".</li><li>Leave out the + and - signs. They are very strict.</li><li>Ask Gubbinz. He knows where everything is. He won't tell you.</li></ul></div>`) +
            (n > PER ? `<div class="gs-pages">Result Pages: ${p > 1 ? `<a href="#" data-pg="${p - 1}">&laquo; Prev</a>` : ''}${Array.from({ length: Math.min(20, Math.ceil(n / PER)) }, (_, i) => i + 1 === p ? `<b>${i + 1}</b>` : `<a href="#" data-pg="${i + 1}">${i + 1}</a>`).join('')}${p * PER < n ? `<a href="#" data-pg="${p + 1}">Next &raquo;</a>` : ''}</div>` : '');
          wire(slice);
          if (page === 1 && qq == null) { Net.kv.inc('web.search.n'); if (/\bjack\b/.test(fold(q))) c.secret('web.searchjack'); }
          Sound.play('click');
        });
      }
      function wire(slice) {
        out.querySelectorAll('[data-r]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const e = INDEX.find(x => x.w === a.dataset.r && x.kind === a.dataset.k); if (e) open(e); }));
        out.querySelectorAll('[data-pg]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); run(+a.dataset.pg, lastQ.startsWith('related:') ? lastQ : null); el.scrollIntoView({ block: 'start' }); }));
        out.querySelectorAll('[data-sim]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); W.pendingCat = a.dataset.sim; W.go('directory'); }));
        out.querySelectorAll('[data-rel]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); where.value = 'web'; run(1, 'related:' + a.dataset.rel); }));
        out.querySelectorAll('[data-tr]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const h = slice[+a.dataset.tr]; if (!h) return; const txt = (h.e.desc || h.e.title).replace(/\s+/g, ' ').slice(0, 220); Desk.msgbox('Babel Jack: Translated into Pirate', orkify(txt) + ' Arr!', 'info', [['OK'], ['More at Babel Jack', () => W.go('orktranslate')]]); }));
      }
      el.querySelector('.gs-form').addEventListener('submit', ev => { ev.preventDefault(); run(1); });
      el.querySelectorAll('[data-q]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); inp.value = a.dataset.q; run(1); }));
      el.querySelectorAll('[data-dcat]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); W.pendingCat = a.dataset.dcat; W.go('directory'); }));
      el.querySelector('.gs-lucky').addEventListener('click', () => ready().then(ix => { const q = inp.value.trim(); const hits = q ? find(q) : []; const e = hits.length ? hits[0].e : W.pick(ix.filter(x => x.kind !== 'main' && !x.sub)); c.secret('web.feelinggrotty'); Sound.play('waaagh'); open(e); }));
      el.querySelectorAll('.gs-advt').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const adv = el.querySelector('.gs-adv'); adv.hidden = !adv.hidden; if (!adv.hidden) adv.querySelector('textarea').focus(); }));
      el.querySelector('.gs-advgo').addEventListener('click', () => { const b = el.querySelector('.gs-adv textarea').value; const q = b.replace(/\bAND\s+NOT\s+/gi, ' -').replace(/\bNOT\s+/gi, ' -').replace(/\b(AND|OR|NEAR)\b/gi, ' ').replace(/[()"]/g, ' ').replace(/\s+/g, ' ').trim(); if (!q) return; inp.value = q; run(1); });
      el.querySelector('.gs-ffc').addEventListener('click', ev => { ev.preventDefault(); Desk.ask('Family Filter', 'The Family Filter is password protected. Enter the password to switch it OFF:', '', 20, v => { if (v == null) return; Sound.play('uhoh'); c.secret('eng.mom'); Desk.msgbox('Family Filter', `Wrong password.\n\nThe Family Filter is still ON. ${/mom|mum|mother/i.test(v || '') ? 'And no, the password is not "' + String(v).slice(0, 20) + '". Mom is cleverer than that.' : 'Mom has been told. (Mom has not been told. But she will find out. She always finds out.)'}`, 'warn'); }); });
      el.querySelector('.gs-img').addEventListener('click', ev => { ev.preventDefault(); Desk.msgbox('JackSearch Images', 'Picture searching is coming in the year 2000! (If the Millennium Bug lets us.)\n\nUntil then, close your eyes and imagine the picture. It is faster than a 56K modem anyway.', 'info'); });
      el.querySelector('.gs-help').addEventListener('click', ev => { ev.preventDefault(); Desk.msgbox('JackSearch Help', 'HOW TO SEARCH\n\n+word  the page MUST have this word\n-word  the page must NOT have this word\nsite:host  only look on one site (try site:jackattack.jnet)\nrelated:address  pages like that one\n\nPick a language to read the results in Pirate (or Robot).\nThe Family Filter is always on. Mom set it.', 'info'); });
      el.querySelector('.gs-about').addEventListener('click', ev => { ev.preventDefault(); Desk.msgbox('About JackSearch', 'JackSearch was started by Gubbinz, who got tired of asking Jack where things were.\n\nIt indexes every page it can find and ranks them by how many times your word appears (and whether Gubbinz likes the page).\n\n"I\'m Feeling Jammy" takes you to the top result, or a random page if you haven\'t typed anything. Like a Super Ball. You never know where it will bounce.', 'info'); });
      setTimeout(() => { if (el.isConnected && !W.pendingQuery && innerWidth > 760) inp.focus(); }, 300);
    },
  });
  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  // ---------------------------------------------------------------- the directory
  W.def('directory', {
    css: CSS,
    html: c => `<div class="gs-top">${logoHtml()} <b>Web Directory</b><form class="gs-form" style="margin-left:auto" autocomplete="off"><input type="text" maxlength="60" aria-label="Search" style="width:200px"><button class="btn" type="submit">Search</button></form></div>
<p class="small">Every site we know about, sorted into categories by hand (Jack's hand). Like a library, but with more blinking. Click a category.</p>
<div class="gs-dir">${Object.keys(CATS).filter(k => k !== 'hidden').map(k => `<div><b><a href="#" data-cat="${k}">${esc(CATS[k])}</a></b> <span class="small gs-cn" data-cn="${k}"></span><br><span class="small gs-sub" data-sub="${k}"></span></div>`).join('')}</div>
<div class="gs-cat"></div>
<div class="gs-foot">Categories visited: <span class="gs-v">0</span> of ${Object.keys(CATS).length - 1}. Visit them all for a surprise. (It's a secret.) &middot; ${c.a('search', 'Back to JackSearch')} &middot; Hits: ${c.counter('plain')}</div>`,
    setup(el, c) {
      const cat = el.querySelector('.gs-cat'), seen = new Set(), v = el.querySelector('.gs-v');
      build().then(ix => {
        for (const k of Object.keys(CATS)) { const list = ix.filter(e => e.cat === k && !e.sub); const cn = el.querySelector(`[data-cn="${k}"]`); if (cn) cn.textContent = '(' + list.length + ')'; const sub = el.querySelector(`[data-sub="${k}"]`); if (sub) sub.innerHTML = list.slice(0, 3).map(e => `<a href="#" data-r="${esc(e.w)}" data-k="${e.kind}">${esc(e.title.replace(/^JACK ATTACK! - /, ''))}</a>`).join(', ') + (list.length > 3 ? ', ...' : ''); }
        el.querySelectorAll('.gs-sub [data-r]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const e = ix.find(x => x.w === a.dataset.r && x.kind === a.dataset.k); if (e) open(e); }));
        const show = k => { const list = ix.filter(e => e.cat === k && !e.sub); seen.add(k); v.textContent = seen.size; if (seen.size >= Object.keys(CATS).length - 1) c.secret('web.directory'); cat.innerHTML = `<h2>${esc(CATS[k])} <span class="small">(${list.length} sites)</span></h2>` + list.map(e => `<div class="gs-res"><a href="#" class="gs-t" data-r="${esc(e.w)}" data-k="${e.kind}">${esc(e.title)}</a><div class="gs-s">${esc(e.desc)}</div><div class="gs-u">${esc(e.url.replace(/^http:\/\//, ''))}</div></div>`).join(''); cat.querySelectorAll('[data-r]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const e = ix.find(x => x.w === a.dataset.r && x.kind === a.dataset.k); if (e) open(e); })); cat.scrollIntoView({ block: 'start', behavior: 'smooth' }); Sound.play('click'); };
        el.querySelectorAll('[data-cat]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); show(a.dataset.cat); }));
        if (W.pendingCat) { show(W.pendingCat); W.pendingCat = ''; }
      });
      el.querySelector('.gs-form').addEventListener('submit', ev => { ev.preventDefault(); W.pendingQuery = el.querySelector('input').value; W.go('search'); });
    },
  });
})();
