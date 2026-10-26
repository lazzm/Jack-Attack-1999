/* The family's files on the family PC (loaded by js/family.js when the PC is idle). Each one turns up on its 1999 date
 * and stays. Mom, Dad, Jack's little sister and Jack all use this computer, and they all complain about each other.
 * The people are the visitor's own cast (js/cast.js): every name, file name and text goes through Cast.t, so {sister} is
 * whatever this visitor's sister is called (her folder too). */
(function () {
  const F = window.Family; if (!F || !window.Apps) return;
  const A = Apps;
  const MD = 'C:/My Documents', MOM = MD + '/Mom', RECIPES = MOM + '/Recipes', DAD = MD + '/Dad', DND = 'C:/DO NOT DELETE - DAD', SIS = MD + '/' + Cast.n('sister');
  const CT = s => (typeof s === 'string' ? Cast.t(s) : s);
  const mdOf = s => { const [m, d] = s.split('-').map(Number); return m * 100 + d; };
  // lines that only show once their date has happened: [['MM-DD', 'line'], ...]
  const gated = (head, lines, foot) => head + lines.filter(l => !l[0] || mdOf(l[0]) <= F.today().md).map(l => l[1]).join('\n') + (foot || '');
  const plain = md => md.replace(/\{[^|{}]*\|([^{}]*)\}/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\/\/(.+?)\/\//g, '$1').replace(/__(.+?)__/g, '$1').replace(/^(#+|>>|>) ?/gm, '');
  const size = t => Math.max(1, Math.ceil(String(t).length / 1024)) + ' KB';
  function txt(path, name, date, text, extra) {
    const n = Object.assign({ name: CT(name), type: 'txt', date }, extra || {});
    if (typeof text === 'function') Object.defineProperty(n, 'text', { get: () => CT(text()), enumerable: true }); else n.text = CT(text);
    return F.addFile(path, n);
  }
  function doc(path, name, date, key, d, extra) {
    d = Object.assign({}, d, { md: CT(d.md) }); // names first: plain() would eat a {x?..|..} choice
    F.addDocs({ [key]: d });
    return F.addFile(path, Object.assign({ name: CT(name), type: 'doc', date, ofk: key, text: plain(d.md), size: size(d.md) }, extra || {}));
  }
  function sheet(path, name, date, key, fn, extra) {
    F.addDocs({ [key]: (...a) => Cast.deep(fn(...a)) });
    return F.addFile(path, Object.assign({ name: CT(name), type: 'xls', date, ofk: key, size: '14 KB' }, extra || {}));
  }
  function pic(path, name, date, draw, extra) {
    const n = Object.assign({ name: CT(name), type: 'png', date, size: '352 KB' }, extra || {});
    let u = null;
    Object.defineProperty(n, 'dataURL', { get() { if (!u) { try { u = draw().toDataURL(); } catch (e) { u = ''; } } return u; }, enumerable: true });
    return F.addFile(path, n);
  }
  const dirDate = (p, d) => { A.fs.dir(p).date = d; };

  // ================================================================ MOM
  dirDate(MOM, '02/01/99'); dirDate(RECIPES, '08/02/99');
  txt(MOM, 'Mobile phone RULES (for {me}).txt', '02/01/99', `RULES FOR {me.NAME}'S MOBILE PHONE
(it was a Christmas present, NOT a human right)

1. Texts cost 10p each. That is YOUR pocket money, not mine.
2. No texting after 9 o'clock at night. I can hear it beeping through the wall.
3. No texting at the dinner table. The phone goes in the fruit bowl.
4. It is for EMERGENCIES and for telling me where you are.
   "wer r u" is not an emergency. "come and get me pls" might be.
5. Do not lend it to {mate1}. Last time {mate1} borrowed a calculator it came back sticky.
6. Do not let {sister} play Snake on it. She cries when she crashes into herself.
7. Charge it on the kitchen side, not next to your bed. I read that somewhere.
8. If it rings in church you will be walking home.

Your Dad says HE doesn't need a mobile phone because "if anybody needs me they can ring the house".
We'll see how long that lasts.

Love Mom x
`);
  txt(MOM, 'Thank you letters - who has done theirs.txt', '03/01/99', () => gated(`THANK YOU LETTERS 1999 - TICK WHEN DONE

{sister} ......... DONE (all 6, with drawings, one has glitter on it, sorry Gran)
{me} ......... NOT DONE. "I'll do it on the computer." ({me.He} has been ON the computer.)
Dad .......... "Do grown-ups have to?" YES.
Me ........... done, obviously
`, [['01-09', `\n09/01 - {me} has done ONE. To Nan. It is very good actually. Printed on the dot-matrix so it looks like a gas bill.`],
    ['01-16', `16/01 - {me}: still 3 to go. Dad: still all of them.`],
    ['01-30', `30/01 - Everybody done. Dad's says "Ta for the socks. Dad". That's it. That's the whole letter.`]]));
  txt(RECIPES, 'Shepherd\'s pie.txt', '08/02/99', `SHEPHERD'S PIE (serves 4, or 3 if {me} is hungry)

1lb mince (it's cottage pie if it's beef, Dad, I KNOW, nobody cares)
1 onion, 2 carrots, a handful of frozen peas
Gravy granules (the red tub)
2lb potatoes, a knob of butter, a splash of milk
Grated cheese on top ({sister}'s job - most of it goes in {sister})

Brown the mince and onion. Add carrots, peas and gravy. Simmer 20 mins.
Mash the potatoes. Spread on top. Fork lines on it ({me}'s job - {me.he} does them in the shape of a Zapachu face).
Cheese. 200C for 25 mins till it's golden and crispy round the edges.

{sister} will pick out the peas. Let her. Life is too short.
`);
  txt(RECIPES, 'Pancakes - Shrove Tuesday.txt', '16/02/99', `PANCAKE DAY (Tues 16th Feb)

4oz plain flour
pinch of salt
1 egg
half a pint of milk
Butter for the pan

Whisk it all up. Leave it to stand while everybody argues about toppings.
Hot pan, tiny bit of butter, thin layer, flip when the edges go lacy.

TOPPINGS:
Me ......... lemon and sugar (the proper way)
Dad ........ golden syrup, far too much
{me} ....... chocolate spread AND banana AND sugar ("it's a pudding pancake")
{sister} ....... just sugar, but she wants to toss it herself

Pancakes on the ceiling this year: 1 (Dad, showing off)
Pancakes on the dog: 0 (we haven't got a dog, {sister}, don't start)
`);
  txt(RECIPES, 'Spag bol ({me}\'s favourite).txt', '15/03/99', `SPAG BOL - {me}'s favourite, {sister}'s least favourite, Dad's "it's alright"

1lb mince, 1 onion, garlic (2 cloves - Dad says it's too much, Dad is wrong)
Tin of chopped tomatoes, squirt of tomato puree, a stock cube
Mixed herbs, salt and pepper
Spaghetti ({sister} has hers snapped in half, she's not a "twirler")

Fry, add everything, simmer for as long as you can stand it.
{me} has {me.his} with "a mountain" of cheese.

N.B. {me} says this is what astronauts eat. It is not. Astronauts eat it out of a tube.
`);
  txt(RECIPES, 'Easter nests ({sister}\'s job).txt', '01/04/99', `CHOCOLATE EASTER NESTS (Easter is 4th April)

1 big bar of milk chocolate
3 shredded wheat biscuits (crushed - {sister} LOVES crushing them)
Mini chocolate eggs
Paper cake cases

Melt the chocolate in a bowl over a pan of hot water (NOT in the microwave, {me}, remember the "incident").
Stir in the crushed wheat. Spoon into cases. Push a dip in the middle. Three little eggs in each.
Fridge for an hour.

Made: 12
Left after one hour: 7
Left after {me} and Dad "tested" them: 3
{sister} has put the last 3 in her room with a sign that says KEEP OUT THIS MEANS EVERYONE.
`);
  doc(MOM, 'Letter to school - {sister}\'s trip.doc', '17/05/99', 'fam_trip', { font: 'Times New Roman', size: 12, md: `>> 17th May 1999

Dear Miss H.,

Thank you for the letter about the class trip to the farm park on Friday. {sister} is very excited and has talked about nothing else (mostly the goats).

I enclose the reply slip and **£6.50** in an envelope, which I believe covers the coach and the entry.

A few things you may need to know:

* {sister} gets travel sick, so please sit her near the front. She has her own sweets for it.
* She will try to bring home a goat. Please do not let her bring home a goat.
* She has a packed lunch. She does not like crusts. I have left the crusts on. We are working on it.

I am happy to help on the day if you need another parent. My husband has also offered, but I think one of us is enough, as he will want to go on the tractor ride himself.

Yours sincerely,

{sister}'s Mom

P.S. {sister}'s {me.sib} {me} says to tell you {me.he} "remembers that farm" and the goats "can't be trusted". I have no idea what {me.he} means.` });
  txt(RECIPES, 'Barbecue (it WILL rain).txt', '12/06/99', `BARBECUE - Saturday (forecast: "sunny spells". Ha.)

SHOPPING:
16 burgers (Dad says 16. For 4 of us. Dad is "being prepared".)
12 sausages
Finger rolls + baps
Ketchup, the brown sauce for Dad
A bag of salad nobody will eat
Firelighters x2 (Dad will say he doesn't need them, then use both)
Ice lollies for after
Bin bags (for the rain)

WHO DOES WHAT:
Dad ...... the barbecue. Nobody else is allowed. He has an apron.
Me ....... everything else
{me} ..... carrying, and "the music" (please, not the Blockology tape again)
{sister} ..... napkins, and telling everybody the sausages are pink in the middle

At 3pm it rained. We ate in the kitchen. Dad stood outside under the umbrella and cooked all 16 burgers anyway.
`);
  txt(MOM, 'Holiday packing list.txt', '22/07/99', `CARAVAN HOLIDAY - PACKING LIST
(we leave Saturday at 7am, Dad says 6, it will be 9)

EVERYONE:
[x] Raincoats (it's a British holiday)
[x] Wellies
[x] Jumpers ("but it's SUMMER" - {me}. Yes. Jumpers.)
[x] Swimming things
[x] Sun cream (in hope)
[x] Travel sweets for {sister}
[x] Cards, Connect 4, the travel Scrabble with the missing Q

{me.NAME}:
[x] Game Lad + batteries (4 spare, {me.he}'ll still run out)
[x] Rubrick's cube
[x] {me.His} mobile (it does NOT work in the caravan field, {me.he} will find this out)
[ ] Computer (NO. {me.He} asked. The answer is no.)
[ ] 12 Ork models (I said TWO. {me.He} has packed seven. Compromise.)

{sister.NAME}:
[x] Mr Snuggles
[x] Her horse colouring book + felt tips
[x] The "holiday diary" for school (make sure she DOES it)

DAD:
[x] The road atlas (he will not look at it)
[x] The windbreak (he will spend one hour putting it up)
[x] His newspaper crossword book

DON'T FORGET: turn the computer OFF at the wall. {me}, I mean OFF. Not "standby".
`);
  txt(MOM, 'Eclipse - 11th August.txt', '09/08/99', `THE ECLIPSE - WEDNESDAY 11th AUGUST, ABOUT 11 O'CLOCK

It's only total down in the very south-west, but it'll go "properly dim" here too, the man on the telly says.

DO NOT LOOK AT THE SUN. NOT EVEN A LITTLE BIT. NOT EVEN THROUGH SUNGLASSES.
({me} - this means you. Dad - this means you too.)

- Eclipse glasses from the newsagent x4 (got them, they're in the drawer under the phone)
- {me} is making a "pinhole viewer" out of a cereal box for school. Do NOT empty the cereal into the bin, {me}.
- {sister} is worried the Sun won't come back. It will come back, sweetheart.
- Dad is going to "pop home from work" to watch it. We'll see.

Afterwards {me} said "the next one in Britain isn't until 2090". {sister} said "I'll be OLD". Dad said "I'll be dead". Nobody laughed. Then everybody laughed.
`);
  txt(RECIPES, 'Apple crumble.txt', '19/09/99', `APPLE CRUMBLE (the apple tree has gone MAD this year)

2lb cooking apples, peeled and sliced ({me} peels, {sister} eats the peel)
2oz sugar, a shake of cinnamon

CRUMBLE:
6oz plain flour, 3oz butter, 3oz sugar
Rub together with your fingertips till it's like breadcrumbs.
({sister}: "it's like sand!" Yes. Delicious sand.)

Apples in the dish, crumble on top, 180C for 40 minutes.
Custard. LOTS of custard. Dad has his with ice cream AND custard, which is greedy.

Apples still on the tree: about four hundred
Apples given to next door: a bag full (Bonnie the dog ate one)
`);
  txt(MOM, 'Halloween costumes.txt', '16/10/99', `HALLOWEEN - SUNDAY 31st

{sister.NAME}: a witch. Needs: black bin bag (cape), hat (make from card), broom from the garage (DUST IT).
       Green face paint. She wants a "real" black cat. No.
{me.NAME}: says {me.he} is "too old" for trick or treating. Is going as "a Y2K bug" to {mate1}'s party instead.
       This is a black jumper with "ERROR" stuck on it in silver tape. I am not sure that counts.
DAD:  will answer the door in his old monster mask and scare the little ones. NOT TOO MUCH this year.
ME:   sweets bowl.

SWEETS FOR THE DOOR: 3 big bags. Hide them from {me} AND Dad until 6pm.
`);
  doc(MOM, 'Christmas card list.doc', '13/11/99', 'fam_cards', { font: 'Times New Roman', size: 12, md: `# CHRISTMAS CARD LIST 1999

**Second class stamps are 19p.** First class is 26p. We are sending second class. We are not made of money.

## FAMILY
* Gran - big card, and {sister}'s drawing (the one with the robin, not the one with the dinosaur)
* Nan - big card, photo of the kids (find one where {me} isn't pulling a face)
* {auntie} & {uncle}, {cousin} & {cousin.his} brothers
* Auntie Jan (she always sends one with a fiver in for each of the kids - {me}, write her a PROPER thank you)
* {greatuncle} (is {greatuncle.he} still at the same address? Ask Gran)

## FRIENDS & NEIGHBOURS
* Next door - from all of us, and "from {sister} to Bonnie" (the dog). Yes, the dog gets a card.
* Karen & Steve ({mate1}'s mom and dad) - and say thank you for having {me} round practically every Saturday
* {mate2}'s mom
* The lady across the road who takes our parcels in
* {mate3}'s mom ({me} says "she's alright, she lets us use the big computer")

## WORK
* Dad's office: he says he'll "do his own". He won't. Buy a box of 20.

## SCHOOL
* {sister}'s teacher - {sister} is making it herself (glitter, God help us)
* {me}'s form tutor - {me} says "nobody does that". {sister} says "I do". {me} is doing one.

---

**Running total:** 34 cards, 34 stamps. That's £6.46 in stamps alone, Dad, before you say anything.

Note to self: do NOT let Dad write them. Last year he signed one "from all at number" and then stopped because the pen ran out.` });
  txt(RECIPES, 'Christmas cake - Stir-up Sunday.txt', '21/11/99', `CHRISTMAS CAKE - STIR-UP SUNDAY (21st Nov)
Everybody stirs and makes a wish. Clockwise. Eyes shut. No telling.

1lb mixed fruit + cherries (soak overnight in cold tea - Gran's way)
8oz butter, 8oz brown sugar, 4 eggs
10oz plain flour, mixed spice, cinnamon
Grated zest of a lemon and an orange
2oz ground almonds

Cream butter and sugar, beat in eggs, fold in flour, spices, fruit.
Lined tin. 140C for 3 and a half hours (YES that long). Skewer comes out clean = done.
Feed it every week till Christmas.

WISHES (they told me anyway):
{sister} ..... a Furby (and a dog)
{me} ..... "the Millennium Bug doesn't happen so the internet still works"
Dad ...... "a quiet New Year". At {mate1}'s party. Good luck.
Me ....... not telling
`);
  txt(MOM, 'Millennium Eve - who\'s doing what.txt', '30/12/99', `NEW YEAR'S EVE - THE MILLENNIUM!!! - PARTY AT {mate1.NAME}'S
Starts 7pm. We are leaving by HALF PAST TWELVE AT THE LATEST.

BRINGING:
Me ....... a trifle (the big bowl), sausage rolls x40
Dad ...... the drinks, and the camping chairs
{me} ..... {me.his} "Y2K emergency kit" (torch, batteries, a tin of beans). {me.He} has insisted. Fine.
{sister} ..... sparklers (to give to a GROWN-UP), and Mr Snuggles, who is also "seeing in the Millennium"

THINGS TO DO BEFORE WE GO:
- Fill the car up (Dad says the petrol pumps "might go funny" - they won't)
- Some cash out, just in case (Dad again)
- {sister} has a nap in the afternoon so she can stay up. (She won't nap.)
- Video the fireworks on the telly in case we miss them
- Unplug the computer. {me} says "it's Y2K compliant". Unplug it anyway.

Happy New Year everybody. Whatever happens, it's been a lovely year. x
`);

  // ================================================================ DAD
  dirDate(DAD, '12/01/99');
  txt(DAD, 'Car insurance.txt', '12/01/99', () => gated(`CAR INSURANCE RENEWAL - due end of January

Last year ................... £389.00
This year (renewal letter) .. £441.20  <-- WHY. Nothing has happened.
Rang round:
  Company A (the one with the jingle) ..... £412.60
  Company B ............................... £430.00
  Company C (man on phone kept calling me "mate") .. £398.50 but £75 excess, no thanks
Went with A. £412.60. Paying monthly as 12 x £36.83 (costs more, I know, I KNOW).

NAMED DRIVERS: me, Mom.
NOT A NAMED DRIVER: {me}. {me.He} asked. {me.He} is not on it. {me.He} is not on it for some years yet.
{me} says {me.he} "drives really well on Ep I Racer". That is not a car.
`, [['06-02', `\n02/06 - Small dent in the back bumper. Mom says she "did not hit the bollard, the bollard moved". Not claiming. £0.`],
    ['08-01', `01/08 - Caravan holiday: 340 miles. {sister} sick twice. Both times on my side.`],
    ['10-14', `14/10 - Somebody has put a Gubbinz sticker on the dashboard. Nobody will admit it. It's staying, actually, I quite like it.`]]));
  sheet(DAD, 'Household budget 99.xls', '06/04/99', 'fam_budget', () => {
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], COL = 'BCDEFGHIJKLM';
    const now = F.today().m;
    const ROWS = [
      ['Dad\'s wages', [1450, 1450, 1450, 1450, 1450, 1450, 1450, 1450, 1450, 1450, 1450, 1690]],
      ['Mom\'s wages (school office)', [540, 540, 540, 540, 540, 540, 270, 0, 540, 540, 540, 540]],
      null,
      ['Mortgage', [398, 398, 398, 398, 398, 398, 398, 398, 398, 398, 398, 398]],
      ['Council tax', [67, 67, 67, 71, 71, 71, 71, 71, 71, 71, 71, 71]],
      ['Gas', [52, 55, 48, 39, 30, 22, 18, 18, 24, 35, 47, 58]],
      ['Electric (the COMPUTER)', [38, 39, 41, 37, 36, 35, 31, 30, 36, 40, 44, 49]],
      ['Phone bill (the INTERNET)', [41.2, 47.85, 62.1, 58.4, 94.17, 71.3, 66.05, 38.9, 63.2, 77.45, 81.6, 90.15]],
      ['Food shopping', [236, 228, 241, 250, 233, 245, 260, 205, 238, 244, 251, 362]],
      ['Petrol (70p a litre!!)', [62, 58, 64, 60, 61, 66, 118, 92, 60, 63, 64, 70]],
      ['Car insurance', [36.83, 36.83, 36.83, 36.83, 36.83, 36.83, 36.83, 36.83, 36.83, 36.83, 36.83, 36.83]],
      ['TV licence', [0, 0, 0, 101, 0, 0, 0, 0, 0, 0, 0, 0]],
      ['Pocket money ({me} + {sister})', [28, 28, 35, 28, 28, 28, 35, 28, 28, 35, 28, 42]],
      ['School stuff / trips', [12, 0, 18, 0, 6.5, 22, 0, 85, 34, 0, 9, 15]],
      ['Holiday (caravan)', [0, 0, 0, 0, 0, 0, 420, 0, 0, 0, 0, 0]],
      ['Christmas', [0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 160, 380]],
      ['Dog', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ];
    const c = { A1: 'HOUSEHOLD BUDGET 1999', A2: '(Dad. Do NOT "improve" this spreadsheet, {me}.)', A4: 'Item' };
    MON.forEach((m, i) => { c[COL[i] + '4'] = m; });
    c.N4 = 'Year so far';
    let r = 5;
    const incRows = [], outRows = [];
    ROWS.forEach(row => {
      if (!row) { c['A' + r] = 'SPENDING'; r++; return; }
      c['A' + r] = row[0];
      row[1].forEach((v, i) => { if (i < now) c[COL[i] + r] = v; });
      c['N' + r] = `=SUM(B${r}:M${r})`;
      (r < 7 ? incRows : outRows).push(r); r++;
    });
    const tIn = r + 1, tOut = r + 2, left = r + 3;
    c['A' + tIn] = 'MONEY IN'; c['A' + tOut] = 'MONEY OUT'; c['A' + left] = 'LEFT OVER';
    for (let i = 0; i <= 12; i++) {
      const col = i < 12 ? COL[i] : 'N';
      if (i < 12 && i >= now) continue;
      c[col + tIn] = `=SUM(${col}${incRows[0]}:${col}${incRows[incRows.length - 1]})`;
      c[col + tOut] = `=SUM(${col}${outRows[0]}:${col}${outRows[outRows.length - 1]})`;
      c[col + left] = `=${col}${tIn}-${col}${tOut}`;
    }
    const n = left + 2;
    c['A' + n] = 'NOTES:';
    c['A' + (n + 1)] = 'Phone bill in May = £94.17. Somebody was on the internet IN THE DAYTIME. (It\'s 1p a minute in the evenings, 4p in the day!!)';
    c['A' + (n + 2)] = 'TV licence went up to £101. For the TELLY. That we only watch to see the weather.';
    c['A' + (n + 3)] = 'Dog: £0. {sister}, the answer is still no.';
    if (now >= 12) c['A' + (n + 4)] = 'December: Christmas. Do not look at the Christmas column. I have not looked at the Christmas column.';
    return { cells: c, colW: { A: 210, N: 90 }, fmt: { A1: 'b c=#000080', A2: 'i c=#808080', [`A4:N4`]: 'b bg=#c0c0c0', [`B5:N${left}`]: 'cur', [`A${tIn}:N${left}`]: 'b', [`A${left}:N${left}`]: 'b c=#008000', ['A' + n]: 'b u', [`A${n + 1}:A${n + 4}`]: 'i', A7: 'b' }, chart: { type: 'bar', range: `A${outRows[0]}:A${outRows[outRows.length - 1]}`, vals: `N${outRows[0]}:N${outRows[outRows.length - 1]}` } };
  });
  sheet(DAD, 'Holiday spends 99.xls', '07/08/99', 'fam_hols', () => ({ cells: {
    A1: 'CARAVAN HOLIDAY - WHERE DID IT ALL GO', A3: 'What', B3: 'Cost', C3: 'Whose fault',
    A4: 'Caravan (7 nights)', B4: 285, C4: 'Mine (I booked it)', A5: 'Petrol there and back', B5: 52.4, C5: 'The caravan site being so far away',
    A6: 'Fish and chips x 4, x 4 nights', B6: 61.6, C6: 'Everybody', A7: '2p machines on the pier', B7: 9.4, C7: '{sister} (and me, a bit)',
    A8: 'Crazy golf', B8: 8, C8: '{me} won. {me.He} will not stop going on about it.', A9: 'Rain ponchos', B9: 6, C9: 'The weather',
    A10: 'Game Lad batteries', B10: 3.99, C10: '{me}', A11: 'Postcards + stamps', B11: 4.2, C11: 'Mom', A12: 'Stick of rock x 6', B12: 4.5, C12: 'Gifts. Ate 2 in the car.',
    A13: 'Indoor swimming pool (it rained)', B13: 11, C13: 'The weather again', A14: 'Plastic windbreak (new, old one blew away)', B14: 7.99, C14: 'The wind',
    A16: 'TOTAL', B16: '=SUM(B4:B14)', A17: 'Per day', B17: '=B16/7', A18: 'Days it rained', B18: 5, A19: 'Days it didn\'t', B19: 2, C19: 'Both spent in the car',
  }, colW: { A: 220, B: 70, C: 270 }, fmt: { A1: 'b c=#008080', 'A3:C3': 'b bg=#c0ffc0', 'B4:B17': 'cur', 'A16:B17': 'b', 'C4:C19': 'i' }, chart: { type: 'pie', range: 'A4:A14', vals: 'B4:B14' } }));

  // ---- C:\DO NOT DELETE - DAD
  dirDate(DND, '28/01/99');
  txt(DND, 'DO NOT DELETE THIS FOLDER.txt', '28/01/99', `THIS FOLDER IS DAD'S.

DO NOT DELETE IT.
DO NOT MOVE IT.
DO NOT PUT GAMES IN IT.
DO NOT RENAME IT TO "DAD'S BORING STUFF" ({me}, I know it was you).
DO NOT DEFRAG IT. I don't know what that means but {me} keeps saying it and I don't trust it.

If the computer says it needs to delete something to make room, delete {me}'s Pocket Critters pictures.
There are four hundred of them. Nobody will notice if there are three hundred and ninety.

- DAD
`, { secret: 'fam.dadfolder' });
  txt(DND, 'Tax return - SENT.txt', '28/01/99', `TAX RETURN 1997-98 - deadline 31st January

[x] Found the P60 (it was in the bread bin. Don't ask.)
[x] Bank interest: £14.22. Fourteen pounds. Twenty-two pence. A whole year.
[x] Filled in the form (took 4 evenings and 1 argument)
[x] Posted it - 28th January, 3 days early. 3 DAYS. Mom said "well done". I'll take it.

NEVER AGAIN leave it this late. (I say this every year.)
`);
  txt(DND, 'Valentine\'s - DO NOT LET MOM SEE.txt', '10/02/99', `VALENTINE'S DAY - SUNDAY 14th

[x] Card (a proper one from the card shop, NOT the petrol station - lesson learned in 1997)
[x] Book a table at the Italian place for Saturday night. Booked. 7:30.
[x] Babysitter: Gran. (Gran says {me} is old enough to babysit {sister}. {sister} says she'd rather have Gran. So would I.)
[ ] Flowers - pick up Saturday morning
[ ] Chocolates - the posh ones, not the ones in the purple tin

If Mom is reading this: hello love. Act surprised.
`);
  txt(DND, 'How to use the computer (by {me}, for Dad).txt', '15/02/99', `HOW TO USE THE COMPUTER - FOR DAD
by {me}

1. The ON button is the big one on the front. Not the one on the back. The one on the back is the "everything off" switch and you have to hold it for ages and it makes the computer sad.
2. Double-click means click TWICE, FAST. Not click, wait, have a think, click again.
3. To make a letter, open WordPad. Do NOT type it in the Run box. Run is not for letters.
4. The internet costs money every minute. Dial up, do your thing, hang up. Don't go and make a cup of tea while it's connected.
5. If a box pops up saying "Are you sure?" read it. Don't just press Yes.
6. The Recycle Bin is not where things go when they're finished. It's where things go when you DELETE them. Your tax letter was in there. I got it back.
7. If it crashes (blue screen), do not hit it. Press any key. If nothing happens, press Ctrl+Alt+Del. If nothing happens, come and get me.
8. Please stop calling the mouse "the mouse thing".
9. The screensaver is not broken. That's what it's meant to do.
10. Do NOT touch my Ork folder. It is not "taking up space". It is an ARCHIVE.

Love {me}
P.S. If {sister} asks to go on Paint, she's allowed, but save before she touches anything.
`);
  txt(DND, 'Top-up card (FOR EMERGENCIES ONLY).txt', '20/02/99', `Bought {me} a top-up card for {me.his} mobile phone for EMERGENCIES ONLY.
Typed the number in here so I don't lose the card. (I've lost the card.)

TALKBRIK PAY AS YOU GO - TOP-UP: £10.00
Code:  1999 1999 2000

To use: on the phone go to Menu, Credit, Top up, and type the 12 numbers.

EMERGENCIES are: car broken down, missed the bus, somebody is hurt.
EMERGENCIES are NOT: "{mate1} has a new game", "what's for tea", "did you tape The Simpsocks".

- Dad
`);
  txt(DND, 'Lottery numbers.txt', '06/03/99', () => gated(`LOTTERY - SAME NUMBERS EVERY SATURDAY (and Wednesdays if I remember)
My numbers: 3, 9, 14, 22, 31, 44
(3 = {me}'s lucky number, 9 = {sister}'s, 14 = Mom's, 22 = the house, 31 = my old football shirt, 44 = no reason, I just like it)

PLAN IF WE WIN:
1. Pay off the house
2. New car (a big one, with the cup holders)
3. A proper holiday, somewhere with sun. Actual sun.
4. {me} wants "a computer that can run everything". Fine.
5. {sister} wants a horse. And a dog. And a horse for the dog.
6. Mom wants "nothing, just for everyone to be happy". Mom wants a conservatory.

RESULTS:
`, [['03-06', '06/03 - 1 number. (The 9. {sister} says it was her that won.)'], ['04-17', '17/04 - 0 numbers.'], ['05-22', '22/05 - 2 numbers. So close.'], ['06-26', '26/06 - 0. The machine hates me.'],
    ['08-14', '14/08 - 3 numbers!!! £10!!! {me} says I should "reinvest it". In what?'], ['09-25', '25/09 - 1 number.'], ['11-13', '13/11 - Mom did the numbers this week. Got 2. Says she\'s "better at it". Nobody is better at it, it\'s random.'],
    ['12-18', '18/12 - Christmas special. 0 numbers. Bah humbug.']]));
  txt(DND, 'Shed.txt', '19/06/99', `THE SHED - PROJECT

Problem: the shed door doesn't shut. It hasn't shut since 1996.
Plan: new hinges (£3.49 for two), oil, a bolt.
Time estimate: 30 minutes.

Saturday:
10:00 - started
10:30 - realised the problem isn't the hinges, it's the door frame
11:15 - went to the DIY shop
12:40 - back from the DIY shop (bought a new drill, the hinges, and a paddling pool for {sister}, don't ask)
14:00 - lunch
16:00 - door shuts!!!
16:01 - door doesn't open
16:30 - {me} got it open with a screwdriver and a lot of "you're doing it wrong Dad"

Time taken: 6 hours 30 minutes. Shed status: door shuts AND opens. Mostly.
`);
  txt(DND, 'Fantasy football 99-00.txt', '07/08/99', () => gated(`FANTASY FOOTBALL - OFFICE LEAGUE 1999-2000
Team name: DAD'S ARMY FC   ({me} wanted "The Space Cadet Knights". No.)
Entry: £5. Prize: £60 and "bragging rights".

Formation: 4-4-2. Like a proper team. None of this "wing-backs" business.
Budget used: £39.5m of £40m. Left: £500,000. ({me} says that "wouldn't even buy a left boot".)

WEEKLY POSITION (out of 14):
`, [['08-14', '14/08 - 9th'], ['08-28', '28/08 - 12th. My goalkeeper let in 5. FIVE.'], ['09-18', '18/09 - 7th!'], ['10-16', '16/10 - 4th!!! Gary from accounts is 1st. Gary picks his team with a pin.'],
    ['11-20', '20/11 - 6th. {me} picked my substitutions this week. Never again.'], ['12-27', '27/12 - 3rd at Christmas. The dream is alive.']]));
  txt(DND, 'Bonfire Night budget.txt', '03/11/99', `BONFIRE NIGHT - FRIDAY 5th

Fireworks (the "family selection box") ...... £19.99
Sparklers x2 boxes ........................... £2.50
Bucket of sand ............................... from the shed (the shed door now opens!!)
Gloves for {sister} (for the sparklers) .......... found in the cupboard
Hot dogs + onions ............................ Mom
Treacle toffee ............................... Gran is bringing it. Hide the dentist's number.

RULES:
- Only DAD lights them. Not {me}, "because I'm nearly an adult". Not {mate1}, ESPECIALLY not {mate1}.
- Light the blue touch paper and STAND WELL BACK. Further than that.
- {sister} watches from the kitchen window if she gets scared. She says she won't. (She will.)
- Bonnie next door hates fireworks. Tell them we're starting at 7 so they can put her in the front room with the telly up.

Last year: 1 rocket went sideways into the hedge. This year: I have READ THE BOX.
`);
  txt(DND, 'CHRISTMAS EVE - BIKE INSTRUCTIONS.txt', '24/12/99', `!!! DO NOT LET {sister.NAME} SEE THIS !!!
(If you are {sister}: this is a boring file about car insurance. Go away. Love Dad.)

{sister.NAME}'S BIKE - FROM FATHER CHRISTMAS
Purple, with the streamers on the handlebars and a basket. And a bell.
Hidden: in the shed, behind the lawnmower, under the old curtains.

ASSEMBLY (after she's asleep - Mom says that means 10 at the EARLIEST, she'll be "listening for reindeer"):
1. Handlebars: put them on the RIGHT WAY ROUND this time. (1997. The scooter. We don't talk about it.)
2. Pedals: the left one goes on BACKWARDS. The instructions say this. Believe the instructions.
3. Stabilisers: yes, still. She's nearly ready to go without. Maybe Easter.
4. Pump the tyres up. The pump is in the car boot.
5. The bell. She will ring the bell at 6am. Accept this.
6. Tie a big bow on it and put it by the tree.
7. Eat the mince pie. Drink the... (Mom says I have to leave a bit). Carrot for the reindeer: take one bite out of it.

{me} has been told and has SWORN not to tell. {me.He}'s helping with step 4. {me.He} says {me.he} wants "a credit in the manual".

Time started: ____  Time finished: ____  Swear words: ____ (aim for zero)
`, { secret: 'fam.bike' });
  txt(DND, 'Y2K - THE PLAN.txt', '28/12/99', `THE MILLENNIUM BUG - THE PLAN
({me} says I'm "being silly". The man at work says his brother-in-law says the cash machines will stop.)

BEFORE NEW YEAR'S EVE:
[x] Cash out of the bank: £100. Under the mattress. (Mom says it's going in the biscuit tin. Fine.)
[x] Full tank of petrol
[x] Torch + batteries ({me} has also packed 12 batteries in {me.his} "Y2K kit", so we're covered)
[x] Candles + matches
[x] A few tins of beans and soup (we always have those anyway)
[x] Bottled water x 6
[ ] Fill the bath (Mom says "absolutely not")
[x] Print out bank statement, so we can PROVE how much is in there. (Printed on the dot-matrix. It took nine minutes. The whole street heard it.)
[x] Unplug the computer at 11:55pm. (We will be at {mate1}'s anyway.)

{me.NAME}'S OPINION: "The computer is Y2K compliant, Dad, I checked, it has a sticker."
MY OPINION: A sticker isn't a guarantee.
{sister.NAME}'S OPINION: "Will Father Christmas still come next year?" Yes, love.

If you are reading this in the year 2000 and everything is fine: told you so ({me}).
`);

  // ================================================================ Jack's little sister ({sister}: always a girl, about 8)
  dirDate(SIS, '10/01/99');
  txt(SIS, '{sister}s diary KEEP OUT.txt', '10/01/99', () => gated(`{sister.NAME}S DIARY
KEEP OUT!!!!!
THIS MEANS {me.NAME}
AND DAD
MOM YOU CAN READ IT

`, [['01-10', '10 jan. {me} showed me how to type. I can type my name {sister.NAME} {sister.NAME} {sister.NAME}. I can do a smiley :)'],
    ['02-16', '16 feb. PANCAKE DAY!!! I tossed mine and it landed on the floor but I ate it anyway Mom said dont but I did.'],
    ['03-06', '6 march. I drawed Bonnie on the computer. Bonnie is next doors dog. I want a dog. Mom says NO. Dad says ask Mom.'],
    ['04-04', '4 april. EASTER!!! I found 9 eggs in the garden and {me} found 3 and {me.he} is BIGGER than me so I WON.'],
    ['05-21', '21 may. the farm trip. I stroked a goat. its name was Gerald. a goat ate Daisys hat. best day ever.'],
    ['06-19', '19 june. somebody deleted my horse picture. I think it was {me}. {me} says it was the computer. I put a note on the screen.'],
    ['07-08', '8 july. sports day I came 2nd in the egg and spoon!!! Dad cheered so loud everyone looked.'],
    ['08-11', '11 august. the eclipse. it went dark in the day time and I held Moms hand. then the sun came back. I knew it would.'],
    ['09-07', '7 sept. back to school. new teacher is nice. I wrote about my holiday on the computer at home and {me} helped with the long words.'],
    ['10-25', '25 oct. I want a FURBY for christmas. everyone at school wants one. {me} says they are "spying on you". they are NOT.'],
    ['10-31', '31 oct. I was a witch. I got 40 sweets. Dad was a monster and a little boy cried. Dad said sorry.'],
    ['12-01', '1 dec. I wrote to Father Christmas. {me} typed it and printed it on the noisy printer. it went zzzt zzzt zzzt.'],
    ['12-25', '25 dec. A BIKE!!!! A PURPLE BIKE!!!! WITH A BELL!!!!! Father Christmas is the best. {me} winked at Dad. I dont know why.']]), { secret: 'fam.lucydiary' });
  txt(SIS, 'Spellings.txt', '18/01/99', `SPELLINGS week 3
by {sister}

because   becuase   because
friend    freind    friend
said      sed       said
people    peeple    people
computer  compooter computer   ({me} says its "computer" I KNOW)
dog       dog       dog  (easy)
dog       dog       dog  (I want one)

I got 9 out of 10. I spelled "because" wrong in the test. I spelled it right 3 times at home!!!
`);
  pic(SIS, 'Bonnie (next doors dog).bmp', '06/03/99', () => drawDog());
  txt(SIS, 'What I want to be when Im big.txt', '20/04/99', `WHAT I WANT TO BE WHEN I AM BIG
by {sister}

1. a vet (so I can have LOTS of dogs and Mom cant say no because its my JOB)
2. a teacher
3. a pop star in a band like Steps
4. an astronaut ({me} says you have to be good at maths. I am OK at maths.)
5. a lady who works at the farm park with Gerald the goat

{me} wants to be "a games designer" or "a Space Cadet". Mom says {me.he} cant be a Space Cadet.
Dad wants to be "retired". Mom wants to be "on a beach".
`);
  pic(SIS, 'My family.bmp', '23/05/99', () => drawFamily());
  txt(SIS, 'Sports day.txt', '08/07/99', `SPORTS DAY!!!!

Egg and spoon .......... 2nd!!!! (my egg did NOT fall off, Chloe's did)
Sack race .............. 5th (I fell over but I got up again)
Running race ........... 4th
Bean bag on head ....... 1st!!!!!!!!!!! WINNER!!!!!

I got a sticker that says WELL DONE.
Dad shouted "GO ON {sister.NAME}!!!" so loud the teachers looked at him.
Mom took photos on the camera. {me} didnt come because {me.he} was at "{me.his} own school" ({me.he} was).
`);
  doc(SIS, 'My Holiday.doc', '07/09/99', 'fam_holiday', { font: 'Comic Sans MS', size: 14, md: `# My Holiday

by **{sister}**

This summer we went on holiday in a {c=blue|caravan} by the seaside. It took a very long time to get there. I was sick 2 times. Dad says both times were on his side of the car.

The caravan had a little table that turns into a bed. I slept on the table! {me} slept on the other table. {me.He} snores. Mom says {me.he} does not snore {me.he} "breathes loudly".

It rained for **5 days**. Dad put up the windbreak and the wind broke it. Then he bought a new one.

On the good day we went on the pier. I played the 2p machines and I won a keyring with a dolphin on it. {me} won at crazy golf and {me.he} said it 100 times.

We had fish and chips every night. A seagull took one of {me}'s chips right out of {me.his} hand. I laughed so much I got hiccups.

{me} was sad because there was no computer. {me.He} played {me.his} Game Lad and the batteries ran out on Thursday. Then {me.he} played cards with me and {me.he} let me win ({me.he} says {me.he} did not let me win).

The best bit was the rock pools. I found a crab. I called him {c=red|Crabby}. I let him go because his mom would miss him.

The worst bit was going home.

**THE END**

> {c=purple|by {sister}, aged 8 and three quarters}` });
  txt(SIS, 'Christmas list (FURBY!!!).txt', '25/10/99', `MY CHRISTMAS LIST 1999
by {sister}

1. a FURBY (the white one with the pink ears)
2. a FURBY (in case the first one gets lost)
3. a dog
4. a bike (purple)
5. glitter pens
6. the Steps CD
7. a dog (I know I put it already)
8. a pony (if no dog)
9. a dog

P.S. {me} says Furbys are "spy robots" and they "remember everything you say". GOOD. Mine will remember I want a dog.
`);
  doc(SIS, 'Letter to Father Christmas.doc', '01/12/99', 'fam_santa', { font: 'Comic Sans MS', size: 14, md: `> {c=red|Dear Father Christmas}

I hope you and Mrs Christmas and the elves and the reindeer are well. It is nearly the **millennium** which is 1000 years. You must be very old.

I have been good this year. Mostly. I did shout at {me} but {me.he} deleted my horse picture ({me.he} says {me.he} didnt).

Please can I have:

* a Furby
* a purple bike with a bell
* glitter pens
* a dog (I know Mom said no but you are in charge)

I will leave you a mince pie and Dad says he will leave you a drink. Rudolph can have a carrot.

Please bring {me} something nice too, {me.he} helped me type this. {me.He} wants "Donkey Wrong 64". {me.He} says you know what that is.

Love from **{sister}** xxx

P.S. Our chimney is a bit small. You can use the back door. Dad leaves it unlocked by accident anyway.` });
  doc(SIS, 'Thank you letter to Gran.doc', '28/12/99', 'fam_gran', { font: 'Comic Sans MS', size: 14, md: `>> 28th December 1999

Dear Gran,

Thank you very much for the **jumper with the horse on it**. It is my favourite jumper now. I wore it on my new bike!

Father Christmas brought me a **PURPLE BIKE**. It has a bell. I rang it at 6 o'clock in the morning and Dad said "here we go".

I also got a Furby. It is called **Sparkle**. It talks all the time. {me} says it is "plotting". It is not plotting, it is singing.

Thank you for the treacle toffee on bonfire night too. It stuck my teeth together.

See you at the Millennium!

Love from **{sister}** xxxxx

> {c=green|({me} helped me with the spelling of Millennium. It has 2 Ls and 2 Ns. That is too many.)}` });

  // ================================================================ JACK
  txt(MD, 'Talkbrik T-99 manual (the important bits).txt', '02/01/99', `TALKBRIK T-99 POCKET PHONE - THE IMPORTANT BITS
(typed up by {me} because the real manual is 200 pages and 40 of them are in Portuguese)

my mobile. It's on my desk next to the PC (on charge, if I remembered).

KEYS
  Big top key ...... Menu / Select / OK
  C ................ back / delete
  Up / Down ........ scroll
  0-9, *, # ........ the numbers (and letters: 2 = ABC, 3 = DEF ... 9 = WXYZ, 0 = space)
  On a computer keyboard: arrows, Enter, Backspace, and you can just type.

TEXTING
  Menu > Messages > Write message. Press a key lots of times for letters (multi-tap: 7777 = S).
  # changes mode: Abc / abc / 123 / T9.
  T9 = PREDICTIVE TEXT. Press each key ONCE and it guesses the word! 4-6-6-3 = "good" (or "home"! press * for the other one).
  160 letters per text max. Texts cost 10p. TEN PEE.
  Send to: anyone online right now (pick them from the list), or a JackNet member's number.
  It says "Message sent". When their phone gets it, it says "Delivered". Proper technology.

CREDIT
  Pay as you go. When you run out, buy a top-up card and type the code in (Menu > Credit > Top up).
  TIP: JACK ATTACK! prints a FREE top-up card at the bottom of the Cheats page. Scratch it!

GAMES
  SNAKE. 2/4/6/8 or the arrows. Don't eat yourself. Level 9 is for lunatics. My best: 211.

RINGTONES
  Menu > Composer. Type a tune in, play it, set it as your ringtone.
  1-7 = notes (C D E F G A B), 0 = rest, 8 = shorter, 9 = longer, * = octave, # = sharp.

BATTERY
  It runs out. Plug the charger in (the plug button next to the phone). Mom says not next to the bed.
`);
  txt(MD, 'Things {sister} has broken.txt', '14/02/99', () => gated(`THINGS {sister.NAME} HAS BROKEN (a list, for evidence)

`, [['01-01', '1. My Game Lad link cable (chewed) - 1998, still counts'], ['01-01', '2. The mouse ball (she took it out to "wash it". It went down the sink.)'],
    ['02-14', '3. My Valentine\'s card to nobody (she found it, read it out at tea, I will never recover)'], ['03-27', '4. Ork Boy no. 14 - snapped his arm off. She says he was "waving goodbye".'],
    ['05-02', '5. The CD-ROM tray. She put a biscuit in it to "see what happens". What happened: the biscuit got stuck.'], ['06-19', '6. My patience. (She says I deleted her horse picture. I did NOT. Paint crashed. Probably.)'],
    ['08-20', '7. The caravan table bed (it was already wobbly but she JUMPED on it)'], ['10-02', '8. My Rubrick\'s cube - she "solved" it by peeling the stickers off.'],
    ['11-30', '9. The silence. She has learned to whistle. She whistles all day.'], ['12-25', '10. My heart a bit - she gave me a drawing of me and Gubbinz for Christmas. It is going on my wall. Don\'t tell her.']]));
  txt(MD, 'Mothers Day card ideas.txt', '10/03/99', `MOTHER'S DAY - SUNDAY 14th MARCH
(do NOT forget like last year, Dad also forgot, it was a bad day for us men)

IDEAS:
- Make a card on the computer! Clip art of flowers + "WORLD'S BEST MOM" in WordArt (the wavy rainbow one)
- Print it on the dot-matrix. (It'll be in grey dots. Mom likes grey. Probably.)
- Breakfast in bed: toast, tea. NOT a boiled egg (Dad's attempt last year: "the egg exploded")
- {sister} is doing a painting. Hers will be better. Mine will have more megabytes.
- Flowers: Dad is buying them. Remind Dad. Remind Dad AGAIN on Saturday.

Budget: £4.50 (from my savings). Chocolates: the box with the caramel ones, not the coffee ones, she hates the coffee ones.
`);
  txt(MD, '{mate3}\'s PC specs ({mate3.he} won\'t shut up).txt', '20/03/99', () => gated(`{mate3.NAME}'S NEW PC - THE SPECS
({mate3} read these out to me on the phone. For 40 minutes. Mom picked up the other phone twice.)

PROCESSOR ..... Pentium III, 500MHz ("FIVE HUNDRED MEGAHERTZ, {me.NAME}")
MEMORY ........ 128MB ("you've got 32" - yes {mate3}, I know)
HARD DRIVE .... 13GB ("thirteen GIGABYTES")
GRAPHICS ...... a 3D card with 16MB on it
SOUND ......... "Sound Blaster Live" with 4 speakers and a "subwoofer" that is louder than {mate3.his} mom
CD ............ a DVD-ROM drive ({mate3.he} has no DVDs. {mate3.He} has ONE DVD. It came with the drive.)
MODEM ......... 56K
MONITOR ....... 17 inch ("SEVENTEEN, {me.NAME}")

WHAT {mate3.He} PLAYS: Half-Loaf, mostly. {mate3.He} says "you wouldn't understand, it's got a STORY".
WHAT I PLAY ON IT WHEN I GO ROUND: Half-Loaf, mostly. It's got a STORY.

THINGS {mate3.He} HAS SAID ABOUT MY COMPUTER:
- "Is it clockwork?"
- "Does it run on coal?"
- "My calculator could beat it at chess"
`, [['04-30', '\nUPDATES:\n30/04 - New graphics card. {mate3.He} showed me the box. {mate3.He} showed me the box for twenty minutes.'],
    ['06-12', '12/06 - Got RollerCoaster Rupeecoon. Built a ride that goes through the toilets. Genius, I admit it.'],
    ['09-04', '04/09 - Tiberian Sun. {mate3.He} is "commanding the Brotherhood". {mate3.He} is commanding {mate3.his} bedroom.'],
    ['09-01', '01/09 - {mate3.He} read in a magazine about a new "GPU" that\'s coming out. {mate3.He} says {mate3.his} card is "obsolete". It\'s FIVE MONTHS OLD.'],
    ['10-15', '15/10 - Age of Emperors II. {mate3.He} sent {mate3.his} villagers to fight my castle. {mate3}, they\'re FARMERS.'],
    ['10-30', '30/10 - New mouse. It hasn\'t got a BALL. It\'s got a little red light underneath. That\'s actually amazing. Don\'t tell {mate3.him} I said that.'],
    ['11-27', '27/11 - Jackreal Tournament. {mate3.He} plays it with the volume so high I can hear it down the phone.'],
    ['12-11', '11/12 - Now {mate3.he} wants Jaquake III. Says {mate3.his} PC "needs a challenge". I need a challenge too: getting through ONE day without hearing about {mate3.his} PC.']]));
  txt(MD, 'ULTRA 64 tournament scores ({mate1} cheats).txt', '06/04/99', () => gated(`THE ULTRA 64 TOURNAMENT OF CHAMPIONS 1999
Players: me, {mate1}, {mate2}, {mate4} ({mate3} won't play, says consoles are "toys")
Venue: {mate1}'s front room ({mate1.his} telly is bigger)
Rules: winner stays on, loser makes the squash

`, [['04-06', `EASTER HOLIDAYS - KART KAOS 64
  Me ......... 14 points
  {mate2} ....... 12
  {mate1} ....... 18 (CHEATED - kept "accidentally" knocking my controller with {mate1.his} elbow)
  {mate4} ...... 3 ({mate4.he} always picks Bouncer and always comes last. Bouncer deserves better.)`],
    ['04-10', `\nGOLDENEYE - 4 PLAYER, LICENCE TO KILL, FACILITY
  Me ......... 21 kills
  {mate1} ....... 25 (CHEATED - SCREEN WATCHING. Also picked Oddjob. Oddjob is SHORT. Everybody knows it's unfair.)
  {mate2} ....... 19
  {mate4} ...... 9 (spent the whole time in the toilets)
  NEW RULE: no Oddjob. {mate1} says it's "not a rule if you only make it up after you lose".`],
    ['05-29', `\nMARIO PARTY (Half term)
  {mate2} WON. {mate2} and {mate1} haven't spoken since. The mini-game where you spin the stick: I have a blister. Mom says it's "a gaming injury" and I should "stop playing it then".`],
    ['07-24', `\nEP I RACER (summer holidays)
  Me ......... 1st, 1st, 2nd, 1st !!!!!!
  {mate1} ....... claims {mate1.his} pod "had a fault". There are no faults. It's a VIDEO GAME.`],
    ['10-23', `\nGOLDENEYE REMATCH (half term) - NO ODDJOB
  {mate1} picked Jaws instead. Jaws is TALL. Somehow {mate1.he} still cheated. HOW.`],
    ['11-27', `\nSUPER SMASH BROS - IT'S OUT!!!
  {mate2} picked Zapachu and is UNBEATABLE. Zapachu shouldn't be that good. He's a mouse.
  {mate1} picked Donkey Wrong and kept throwing everybody off the edge. Not technically cheating. FEELS like cheating.`],
    ['12-29', `\nFINAL STANDINGS 1999
  1. {mate1} (asterisk: CHEATED)
  2. Me (actual winner, morally)
  3. {mate2}
  4. {mate4} (still Bouncer)
  Next year's tournament: the YEAR 2000 TOURNAMENT. Venue: {mate1}'s. Rules: NO ODDJOB, NO JAWS, NO ELBOWS.`]]));
  txt(MD, 'Phone bill - my side of the story.txt', '05/05/99', `THE PHONE BILL (£94.17) - MY SIDE OF THE STORY
for Mom and Dad, please read before you shout

1. I was NOT on the internet in the daytime "all the time". Only in the holidays.
2. It was for RESEARCH. For my website. Which is basically homework.
3. Some of it was {sister}, ringing Gran to sing her the whole of a Steps song. Twice.
4. Some of it was Dad looking up "the cricket score". For 2 hours. On a Tuesday.
5. {mate3} rang me and read out his PC specs for 40 minutes, and Mom you were ON the other phone, so you know.
6. I will only go on the internet after 6pm from now on. When it's cheaper. Like a responsible citizen.
7. I'll pay some back from my pocket money: £1 a week for 10 weeks. That's £10. That's FAIR.

Signed, {me}.
(Mom said "fine" and "£2 a week". We agreed on £1.50. Negotiation is a life skill.)
`);
  txt(MD, '{mate4} owes me 2 quid.txt', '08/05/99', () => gated(`{mate4.NAME} OWES ME 2 QUID
(and other money. A record. So {mate4.he} can't say {mate4.he} doesn't.)

`, [['05-08', '08/05  Lent {mate4.him} £2 for chips after football. "I\'ll pay you Monday."            OWES: £2.00'],
    ['05-10', '10/05  It is Monday. {mate4.He} said "which Monday".                                  OWES: £2.00'],
    ['06-04', '04/06  Lent {mate4.him} 50p for the vending machine (a Twix that got stuck)            OWES: £2.50'],
    ['06-04', '04/06  The Twix fell out later and {mate4.he} ate it. Still counts.                   OWES: £2.50'],
    ['07-02', '02/07  {mate4.He} paid back 20p. In 1p coins. Twenty of them. Hilarious.             OWES: £2.30'],
    ['08-19', '19/08  Lent {mate4.him} £1 for a Pocket Critters magazine (we haven\'t even GOT the game yet)   OWES: £3.30'],
    ['09-27', '27/09  {mate4.He} says I owe {mate4.Him} £1 for "the time {mate4.he} let me have {mate4.his} chips" in 1997.   OWES: £2.30 (disputed)'],
    ['10-30', '30/10  Paid back £1.50!!!! Says "we\'re basically square". WE ARE NOT SQUARE.     OWES: £0.80'],
    ['12-20', '20/12  {mate4.He} bought me a Christmas present: a Gubbinz keyring. Price tag: £2.     OWES: ...'],
    ['12-20', '\nOK. We\'re square. Merry Christmas, {mate4}.\n(You still owe me 80p.)']]), { secret: 'fam.owed' });
  txt(MD, 'REVISION TIMETABLE (honest).txt', '24/05/99', `REVISION TIMETABLE - END OF YEAR EXAMS
LEFT column: the plan (Mom has a copy, it's on the fridge).
RIGHT column: what actually happened (Mom does NOT have a copy).

DAY        PLAN                              WHAT ACTUALLY HAPPENED
---------  --------------------------------  --------------------------------------------
Mon 24     Maths: algebra (2 hours)          Algebra, 20 mins. Then "a quick go" on Snake. Score: 188.
Tue 25     Science: the heart + lungs        Drew a diagram of the heart. It turned into Doctor Whoops. He has 2 hearts now.
Wed 26     English: the poems                Read one poem. {sister} made me play Connect 4. She won. Again.
Thu 27     French: verbs                     "J'ai joue a Goldenballs". That's a verb. That counts.
Fri 28     History: World War 1              Actually did 2 hours!!! Dad helped. Dad knows LOADS about it. Who knew.
Sat 29     REST DAY (allowed)                Marlo Party at {mate1}'s. Got a blister.
Sun 30     Geography: rivers                 Mom made me go to the big supermarket. Saw a river from the car. Revision.
Mon 31     Maths again                       {mate3} rang. Pentium III. 40 minutes. NO MATHS DONE.
Tue 1      Science: electricity              Fixed the plug on {sister}'s hairdryer. PRACTICAL electricity.
Wed 2      EVERYTHING (panic day)            Panicked. Revised. Ate a whole packet of custard creams. Felt better.

RESULTS (filled in later): Maths B, Science A (the Doctor Whoops heart diagram, I think the teacher liked it), English B, French C (worth it), History A (thanks Dad).
Mom says "imagine if you'd actually stuck to the timetable". I'd rather not.
`);
  txt(MD, 'Fathers Day - what to get Dad.txt', '17/06/99', `FATHER'S DAY - SUNDAY 20th JUNE

IDEAS:
- Socks (classic, boring, he will love them)
- A mug that says WORLD'S BEST DAD ({sister} is getting this, so NOT this)
- A book about the shed? (Is there a book about sheds? There must be.)
- Teach him how to use the internet without phoning the speaking clock by accident
- A "voucher" for me to wash the car (costs me nothing, worth a LOT to him)
- Let him win at Goldenballs (no. there are limits.)

DECISION: card made on the computer + car wash voucher + a bag of the toffees he likes. Total: 89p. Love: priceless.
`);
  txt(MD, 'Pocket Critters trades with {mate2}.txt', '09/10/99', () => gated(`POCKET CRITTERS TRADES WITH {mate2.NAME}
Me: BLUE. {mate2}: RED. We need each other. That's how they get you.
Link cable: mine ({sister} chewed the old one, see "Things {sister} has broken")

`, [['10-09', `09/10  Traded my Meowth for {mate2.his} Ekans. Fair. Both version exclusives. Handshake.`],
    ['10-09', `09/10  {mate2.He} picked Charbroiler. I picked Squirturtle. Squirturtle is better. ({mate2.He} disagrees. {mate2.He} is wrong.)`],
    ['10-16', `16/10  Traded Kadabra to {mate2.him} so it evolves into ALAKABAM, then {mate2.he} traded it back. {mate2.He} "accidentally" took 20 minutes to trade it back. I watched {mate2.him} the whole time.`],
    ['10-23', `23/10  Got {mate2.his} Oddish for my Bellsprout. They're basically the same plant. Doesn't matter. Pokedex.`],
    ['10-30', `30/10  {mate2} says there's a MEW under the truck by the S.S. Anne. You need to use Strength. We spent ALL AFTERNOON. There is no Mew. There is a truck.`],
    ['11-06', `06/11  Traded Graveler -> came back as GOLEM. {mate2} kept it for one night "to look after it". It came back at level 39. It was level 38. WHAT DID YOU DO, {mate2.NAME}.`],
    ['11-13', `13/11  Swapped Scyther ({mate2.his}) for Pinsir (mine). I think I won that one.`],
    ['11-20', `20/11  {mate1} wants to trade too but {mate1.he} hasn't got the game, just a Game Lad with no batteries and "a really good feeling about Jigglypuff".`],
    ['12-04', `04/12  Haunter -> GENGAR. We both screamed. {sister} came in to see who was hurt.`],
    ['12-18', `18/12  POKEDEX: 131 seen, 119 caught. {mate2}: 127 caught. {mate2.He} IS AHEAD. Need: Electabuzz ({mate2.his}). Offering: anything. ANYTHING.`],
    ['12-28', `28/12  Got the Electabuzz. Paid: my Persian AND a promise to let {mate2.him} have first go on Donkey Wrong 64. Worth it.`]], `\n\nRULE: no trading Pocket Critters you've nicknamed after your mom. ({mate2} named {mate2.his} Chansey "MOM". Mom didn't find it funny.)\n`));
  txt(MD, 'Christmas presents for the family (budget 15 quid).txt', '11/12/99', `CHRISTMAS PRESENTS 1999 - BUDGET: £15.00 (saved since October + selling my old Game Lad games to my mate {mate4})

MOM ..... bath stuff from the chemist in the posh box (£4.99) + I'll make her a calendar on the computer for 2000 with photos of all of us
DAD ..... a fancy torch for his "Y2K kit" (£3.50). He will love it. He will say "you shouldn't have". I should have.
{sister.NAME} .... a Furby is £30. I am not made of money. Glitter pens + a dog colouring book (£3.20). And I'll teach her Snake on my phone.
GRAN .... a photo of me and {sister} in a frame (£2.00, Mom chips in)
NAN ..... same frame, different photo (£2.00)
{mate1.NAME} .... we said no presents this year. (I got {mate1.him} a keyring anyway, 50p. It's a tiny Goldenballs gun. {mate1.He}'ll get it.)

TOTAL: £16.19. Over budget by £1.19. {mate4} owes me 80p. Problem nearly solved.
`);

  // ================================================================ the sticky notes on the desktop
  F.sticky(Cast.deep([
    { id: 's0226', date: '26/02/99', head: 'WHO\'S BEEN ON THE COMPUTER?!', text: 'There are 400 files called "ork" on here.', by: 'DAD', rot: -3 },
    { id: 's0314', date: '14/03/99', head: 'WHO LEFT THE COMPUTER ON ALL NIGHT?!', text: 'The fan was going like a hairdryer. Electricity costs MONEY.', by: 'MOM', rot: 2 },
    { id: 's0503', date: '03/05/99', head: 'WHO\'S BEEN ON THE COMPUTER?!', text: 'The phone bill is £94.17. NINETY-FOUR POUNDS. On the internet IN THE DAYTIME.', by: 'DAD', rot: -2 },
    { id: 's0619', date: '19/06/99', head: 'WHO DELETED MY HORSE PICTURE?!', text: 'It was MY turn on the computer. I know it was you.', by: '{sister}', rot: 4 },
    { id: 's0814', date: '14/08/99', head: 'WHO\'S BEEN ON MY PHONE?!', text: 'Somebody has played Snake and got 12. TWELVE. And sent a text to {mate1} saying "hello this is {me}\'s mom". I know it was you {sister}.', by: '{me.NAME}', rot: -1 },
    { id: 's0905', date: '05/09/99', head: 'WHO SET THE CLOCK TO THE YEAR 2000??', text: '"To test it." DON\'T test it. Put it back.', by: 'DAD', rot: 3 },
    { id: 's1031', date: '31/10/99', head: 'WHO\'S BEEN ON THE COMPUTER?!', text: 'Somebody has made the background a picture of a GOBLIN.\n(it\'s an ORK, Mom - {me})', by: 'MOM', rot: -3 },
    { id: 's1218', date: '18/12/99', head: 'WHO\'S BEEN ON THE COMPUTER?!', text: 'Somebody has been reading my Christmas list. Father Christmas is WATCHING.', by: 'MOM', rot: 2 },
  ]));

  // ================================================================ the sister's Paint pictures (drawn like an 8-year-old with a mouse)
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = 480; c.height = 320; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 480, 320); g.scale(480 / w, 320 / h); g.lineCap = 'round'; g.lineJoin = 'round'; return [c, g]; } // Paint's canvas is 480x320
  // a wobbly mouse-drawn line through points
  function wobble(g, R, pts, col, wd, close, fill) {
    g.beginPath();
    pts.forEach(([x, y], i) => { const jx = x + (R() - 0.5) * 3, jy = y + (R() - 0.5) * 3; i ? g.lineTo(jx, jy) : g.moveTo(jx, jy); });
    if (close) g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    g.strokeStyle = col; g.lineWidth = wd || 3; g.stroke();
  }
  const ell = (cx, cy, rx, ry, n) => Array.from({ length: n || 22 }, (_, i) => { const a = i / (n || 22) * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  function scribble(g, R, x0, y0, x1, y1, col, step) { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); for (let x = x0; x < x1; x += step || 7) { g.moveTo(x + R() * 3, y0 + R() * 4); g.lineTo(x + 6 + R() * 3, y1 - R() * 4); } g.stroke(); }
  function label(g, text, x, y, col, size, rot) { g.save(); g.translate(x, y); g.rotate(rot || 0); g.fillStyle = col; g.font = `bold ${size || 22}px "Comic Sans MS","Comic Neue",cursive`; g.fillText(text, 0, 0); g.restore(); }
  function drawDog() {
    const [c, g] = canvas(480, 360), R = rng(19990306);
    scribble(g, R, 0, 0, 480, 70, '#7ec8ff', 9);
    scribble(g, R, 0, 270, 480, 360, '#38b030', 6);
    wobble(g, R, ell(420, 50, 30, 30), '#e0a000', 4, true, '#ffe000');
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; wobble(g, R, [[420 + Math.cos(a) * 38, 50 + Math.sin(a) * 38], [420 + Math.cos(a) * 58, 50 + Math.sin(a) * 58]], '#ffc000', 4); }
    wobble(g, R, ell(230, 210, 110, 55), '#5a3010', 4, true, '#b07030');
    wobble(g, R, ell(120, 150, 52, 46), '#5a3010', 4, true, '#b07030');
    wobble(g, R, [[85, 120], [62, 110], [58, 170], [80, 175]], '#3a2008', 4, true, '#6a4018');
    wobble(g, R, [[150, 118], [172, 104], [182, 160], [160, 168]], '#3a2008', 4, true, '#6a4018');
    wobble(g, R, ell(105, 140, 6, 7, 10), '#000', 3, true, '#000'); wobble(g, R, ell(135, 140, 6, 7, 10), '#000', 3, true, '#000');
    wobble(g, R, ell(118, 165, 11, 8, 12), '#000', 3, true, '#202020');
    wobble(g, R, [[104, 180], [118, 190], [134, 180]], '#000', 3);
    wobble(g, R, [[118, 190], [122, 210], [130, 204]], '#e04060', 4, false, '#ff7090');
    [[160, 250], [205, 258], [265, 258], [310, 250]].forEach(([x, y]) => wobble(g, R, [[x, y], [x - 4, y + 42], [x + 14, y + 44]], '#5a3010', 6));
    wobble(g, R, [[335, 200], [370, 170], [385, 150]], '#5a3010', 7);
    wobble(g, R, ell(260, 205, 18, 14, 12), '#5a3010', 2, true, '#ffffff');
    wobble(g, R, ell(55, 300, 14, 10, 10), '#c03030', 3, true, '#ff4040'); wobble(g, R, [[55, 310], [55, 340]], '#2a8a20', 4);
    wobble(g, R, ell(440, 310, 14, 10, 10), '#c030c0', 3, true, '#ff70ff'); wobble(g, R, [[440, 320], [440, 345]], '#2a8a20', 4);
    label(g, 'BONNIE', 190, 330, '#c00000', 34, -0.03);
    label(g, '(next doors dog)', 150, 112, '#0000c0', 18, 0.05);
    label(g, 'I want a dog', 270, 95, '#a000a0', 22, -0.06);
    label(g, Cast.t('by {sister}'), 380, 350, '#000', 16);
    return c;
  }
  function drawFamily() {
    const [c, g] = canvas(520, 360), R = rng(19990523);
    scribble(g, R, 0, 290, 520, 360, '#38b030', 6);
    wobble(g, R, ell(60, 50, 28, 28), '#e0a000', 4, true, '#ffe000');
    const person = (x, h, hair, top, legs, name, extra) => {
      const head = 300 - h;
      wobble(g, R, ell(x, head, 20, 22, 14), '#a06030', 3, true, '#ffd8b0');
      wobble(g, R, ell(x - 7, head - 3, 2, 2, 6), '#000', 2, true, '#000'); wobble(g, R, ell(x + 7, head - 3, 2, 2, 6), '#000', 2, true, '#000');
      wobble(g, R, [[x - 8, head + 8], [x, head + 13], [x + 8, head + 8]], '#c00000', 3);
      hair(x, head);
      wobble(g, R, [[x - 22, head + 26], [x + 22, head + 26], [x + 26, 300 - h * 0.35], [x - 26, 300 - h * 0.35]], '#000', 3, true, top);
      wobble(g, R, [[x - 10, 300 - h * 0.35], [x - 14, 298]], legs, 7); wobble(g, R, [[x + 10, 300 - h * 0.35], [x + 14, 298]], legs, 7);
      wobble(g, R, [[x - 22, head + 32], [x - 42, head + 70]], '#ffd8b0', 6); wobble(g, R, [[x + 22, head + 32], [x + 42, head + 70]], '#ffd8b0', 6);
      if (extra) extra(x, head);
      label(g, name, x - name.length * 6, 330, '#000', 20);
    };
    person(70, 190, (x, y) => wobble(g, R, [[x - 22, y - 4], [x - 16, y - 24], [x + 16, y - 24], [x + 22, y - 4]], '#4a2a10', 7), '#3060e0', '#303080', 'DAD', (x, y) => label(g, 'zzz', x + 18, y - 30, '#808080', 16));
    person(175, 175, (x, y) => { wobble(g, R, [[x - 24, y + 22], [x - 22, y - 20], [x, y - 28], [x + 22, y - 20], [x + 24, y + 22]], '#c06000', 7); }, '#e03080', '#5050a0', 'MOM', (x, y) => wobble(g, R, ell(x + 44, y + 74, 8, 8, 8), '#a00000', 2, true, '#ff3030'));
    person(285, 150, (x, y) => wobble(g, R, [[x - 20, y - 12], [x - 10, y - 26], [x, y - 18], [x + 10, y - 27], [x + 20, y - 12]], '#3a2008', 6), '#208020', '#202020', Cast.t('{me.NAME}'), (x, y) => { wobble(g, R, [[x + 44, y + 60], [x + 70, y + 60], [x + 70, y + 98], [x + 44, y + 98]], '#000', 3, true, '#c0c0c0'); wobble(g, R, [[x + 49, y + 65], [x + 65, y + 65], [x + 65, y + 82], [x + 49, y + 82]], '#000', 2, true, '#9fcf4f'); });
    person(385, 110, (x, y) => { wobble(g, R, [[x - 20, y - 6], [x - 14, y - 22], [x + 14, y - 22], [x + 20, y - 6]], '#e0b000', 7); wobble(g, R, [[x - 22, y], [x - 30, y + 30]], '#e0b000', 6); wobble(g, R, [[x + 22, y], [x + 30, y + 30]], '#e0b000', 6); }, '#a020c0', '#ff70c0', 'ME');
    wobble(g, R, ell(470, 270, 30, 16), '#5a3010', 3, true, '#b07030'); wobble(g, R, ell(445, 252, 14, 12), '#5a3010', 3, true, '#b07030');
    wobble(g, R, [[455, 284], [455, 298]], '#5a3010', 5); wobble(g, R, [[485, 284], [485, 298]], '#5a3010', 5);
    label(g, 'Bonnie', 430, 225, '#000', 16); label(g, '(not ours)', 425, 345, '#808080', 14);
    label(g, 'MY FAMILY', 170, 40, '#c00000', 36, -0.02);
    label(g, Cast.t('{me} is on {me.his} phone'), 230, 80, '#208020', 16, 0.03);
    return c;
  }
})();
