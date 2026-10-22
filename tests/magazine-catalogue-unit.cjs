'use strict';

// Pure catalogue checks: no server, browser, live state, artwork or dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const filename = path.join(__dirname, '../app/public/js/magazine-cat.js');
const source = fs.readFileSync(filename, 'utf8');
const cat = require(filename);
const headlines = [
  'SPACE JACK PINBALL', 'BUILD YOUR CITY', 'JAQUAKE UNLEASHED',
  'ROLLERJACK TYCOON', 'POD JACK RACER', 'DUNGEON KEEPA 2',
  'REACH FOR THE STARS', 'ROBO RUMBLE', 'HYPER DRIVE 2000',
  'POCKET CRITTERS', 'THE MODEM BOYS', 'THE BIG WINTER ISSUE'
];
const aliases = {
  mags: 'pm.mag.01',
  'reading.mag.floor1': 'pm.mag.02',
  'reading.mag.floor2': 'pm.mag.03',
  'reading.mag.bed': 'pm.mag.04',
  'reading.mag.back1': 'pm.mag.05',
  'reading.mag.back2': 'pm.mag.06'
};
const wordCount = text => text.trim().split(/\s+/u).length;
const plain = value => JSON.parse(JSON.stringify(value));

test('twelve canonical 1999 monthly issues preserve IDs, release dates and cover briefs', () => {
  assert.equal(cat.ISSUES.length, 12);
  assert.deepEqual(Object.keys(cat.byId), cat.ISSUES.map(issue => issue.id));
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const fields = ['id', 'month', 'title', 'publication', 'issue', 'rel',
    'price', 'art', 'color', 'headline', 'kicker', 'pages'];
  for (const [index, issue] of cat.ISSUES.entries()) {
    const mm = String(index + 1).padStart(2, '0');
    assert.deepEqual(Object.keys(issue).sort(), fields.slice().sort());
    assert.equal(issue.id, 'pm.mag.' + mm);
    assert.equal(issue.month, index + 1);
    assert.equal(issue.issue, index + 1);
    assert.equal(issue.rel, '01/' + mm);
    assert.equal(issue.publication, 'JACK ATTACK!');
    assert.ok(issue.title.startsWith(months[index] + ' 1999: '));
    assert.equal(issue.headline, headlines[index]);
    assert.ok(Number.isInteger(issue.price) && issue.price >= 15 && issue.price <= 30);
    assert.equal(issue.art, mm, 'Art basename must match independently generated monthly cover');
    assert.equal('/art/magazines-v1/' + issue.art + '.webp', '/art/magazines-v1/' + mm + '.webp');
    assert.match(issue.color, /^#[\da-f]{6}$/i);
    assert.ok(issue.kicker.length >= 30 && issue.kicker.length <= 120);
    assert.strictEqual(cat.byId[issue.id], issue, 'Lookup must return the actual issue');
  }
  for (const field of ['id', 'title', 'headline', 'kicker', 'art', 'color']) {
    assert.equal(new Set(cat.ISSUES.map(issue => issue[field])).size, 12, field + ' must be distinct');
  }
});

test('only January and February are starters; physical aliases do not become inventory keys', () => {
  assert.deepEqual(cat.STARTER, ['pm.mag.01', 'pm.mag.02']);
  assert.deepEqual(cat.LEGACY_ALIASES, aliases);
  assert.equal(new Set(Object.values(cat.LEGACY_ALIASES)).size, 6);
  for (const [prop, canonical] of Object.entries(cat.LEGACY_ALIASES)) {
    assert.ok(cat.byId[canonical]);
    assert.equal(cat.byId[prop], undefined);
  }
  assert.equal(cat.LEGACY_ALIASES['ch.m.comic'], undefined);
  for (const unknown of ['pm.mag.00', 'pm.mag.13', 'pm.mag.1', 'constructor', '__proto__']) {
    assert.equal(cat.byId[unknown], undefined);
  }
});

test('every issue contains six original readable pages in the agreed editorial order', () => {
  const genres = ['Editorial', 'Review', 'Guide', 'Letters', 'Advertisement', 'Comic'];
  const pages = cat.ISSUES.flatMap(issue => issue.pages);
  assert.equal(pages.length, 72);
  assert.equal(new Set(pages.map(page => page.title)).size, 72);
  assert.equal(new Set(pages.map(page => page.body)).size, 72);
  const paragraphs = new Set();
  for (const issue of cat.ISSUES) {
    assert.equal(issue.pages.length, 6, issue.id);
    issue.pages.forEach((page, index) => {
      assert.equal(typeof page.title, 'string');
      assert.ok(page.title.startsWith(genres[index] + ': '), issue.id + ' page order');
      assert.equal(typeof page.body, 'string');
      const count = wordCount(page.body);
      assert.ok(count >= 100 && count <= 180, `${issue.id} ${page.title}: ${count} words`);
      assert.ok(page.body.includes('\n\n'), 'Readable paragraph breaks required');
      assert.doesNotMatch(page.body, /\b(?:TODO|TBD|lorem ipsum|coming soon content)\b/i);
      assert.doesNotMatch(page.body, /<\/?(?:script|iframe)|\bonclick\s*=/i);
      for (const paragraph of page.body.split(/\n\s*\n/u)) {
        assert.ok(!paragraphs.has(paragraph), 'Repeated filler paragraph: ' + page.title);
        paragraphs.add(paragraph);
      }
      if (page.side !== undefined) assert.equal(typeof page.side, 'string');
    });
  }
});

test('first-of-month editions distinguish previews from later game releases', () => {
  for (const [id, release] of [
    ['pm.mag.01', /1 February/],
    ['pm.mag.03', /17 March/],
    ['pm.mag.04', /12 April/],
    ['pm.mag.05', /19 May/],
    ['pm.mag.06', /25 June/]
  ]) {
    const issue = cat.byId[id];
    assert.match(issue.pages[0].body, release);
    assert.match(issue.pages[1].body, /preview|shareware/i);
    assert.match(issue.pages[1].body, /no final|cannot earn a final score|saving our score|after.*release|must earn its own verdict/i);
  }
  assert.match(cat.byId['pm.mag.02'].pages[0].body, /arrived on 31 January/);
  assert.match(cat.byId['pm.mag.09'].pages[0].body, /September 1999/);
  assert.match(cat.byId['pm.mag.12'].pages[0].body, /next calendar unopened/);
  const prose = cat.ISSUES.map(issue => [issue.title, issue.kicker,
    ...issue.pages.flatMap(page => [page.title, page.body])].join('\n')).join('\n');
  assert.doesNotMatch(prose, /\b(?:20(?:0[1-9]|[1-9]\d)|Windows|Microsoft|mum|smartphone|streaming|swipe|tap)\b/i);
  assert.doesNotMatch(prose, /https?:\/\/|\bwww\.|\b[\w-]+\.(?:com|org|net|co\.uk)\b/i);
});

test('browser script exports only MagazineCat without Cast, DOM, timers or storage', () => {
  const browser = { window: {} };
  const before = Object.keys(browser.window);
  vm.runInNewContext(source, browser, { filename, timeout: 1000 });
  assert.deepEqual(before, []);
  assert.deepEqual(Object.keys(browser.window), ['MagazineCat']);
  assert.deepEqual(Object.keys(browser), ['window']);
  assert.deepEqual(plain(browser.window.MagazineCat), plain(cat));
  assert.strictEqual(browser.window.MagazineCat.byId['pm.mag.01'], browser.window.MagazineCat.ISSUES[0]);
});

test('CommonJS and worker-like environments need no browser globals or Cast lookups', () => {
  const server = { module: { exports: {} } };
  for (const global of ['document', 'Cast', 'localStorage', 'fetch', 'Date', 'setTimeout']) {
    Object.defineProperty(server, global, {
      get() { throw new Error('Unexpected global dependency: ' + global); }
    });
  }
  vm.runInNewContext(source, server, { filename, timeout: 1000 });
  assert.deepEqual(plain(server.module.exports), plain(cat));
  assert.equal(Object.hasOwn(server, 'MagazineCat'), false);
  const worker = {};
  vm.runInNewContext(source, worker, { filename, timeout: 1000 });
  assert.deepEqual(Object.keys(worker), ['MagazineCat']);
  assert.deepEqual(plain(worker.MagazineCat), plain(cat));
});
