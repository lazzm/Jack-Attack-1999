/* Story objectives: shared by Node and the browser. Tests describe evidence, never pay. */
(function (root) {
  'use strict';
  const chapters = [
    { id: 1, title: 'Just a Game Lad', steps: [
      { id: 'lad', text: 'One quick go on my Game Lad.', hint: 'The Game Lad is on my desk. F plays, E carries it, Q leans back. Press Enter to start the game.', test: 'play.gb' },
      { id: 'tidy', text: 'Better tidy my room. Mom can hear the mess.', hint: 'Mom\'s list is on the wall. Clothes in the basket, rubbish in the bin, dirty dishes in the kitchen sink.', test: 'chore.tidy' },
      { id: 'bed', text: 'Make the bed. Apparently a duvet heap does not count.', hint: 'Pick up the pillow and pyjamas, put them on the bed, then F at the duvet to straighten it.', test: 'chore.bed' },
      { id: 'bin', text: 'Take my bin bag down before it grows legs.', hint: 'F at my bin ties the bag. E picks it up. Take it to the kitchen bin and E puts it in.', test: 'chore.bin' },
      { id: 'downstairs', text: 'Go downstairs. See what everyone is up to.', hint: 'F opens the bedroom door. Follow the landing to the stairs, then into the hall or lounge.', test: 'room.downstairs' },
      { id: 'pc', text: 'Have a go on JackOS.', hint: 'Sit at the PC with F. Q or F2 gets me back into the house. The PC stays on.', test: 'pc.use' },
      { id: 'pixelpost', text: 'Find the Pixel Post catalogue on JackNet.', hint: 'In JackNet Explorer, enter www.pixelpost.jnet. Look at the consoles and their prices.', test: 'web.pixelpost' },
      { id: 'plan', text: 'Put my console plan in the diary.', hint: 'F reads the blue diary on my desk. There is a copy under Start > Programs > Accessories on JackOS too.', test: 'diary.read' },
    ] },
    { id: 2, title: 'Saving up', steps: [
      { id: 'save', text: 'Save enough for my first console. Every penny counts.', hint: 'Mom\'s jobs pay cash. There are games and jobs on JackOS too. JackNet Bank swaps £1 for 20 Rupees. The Segue costs 360 Rupees; keep saving for a different one if I fancy it.', test: 'money.console' },
      { id: 'order', text: 'Choose a console and order it from Pixel Post.', hint: 'www.pixelpost.jnet sells console hardware and games. Pick any console that is out. I will need a game for it too.', test: 'order.console' },
      { id: 'unbox', text: 'My parcel! Open it by the front door.', hint: 'Stand up from the PC. F opens the Pixel Post parcel in the hall.', test: 'parcel.console' },
      { id: 'carry', text: 'Carry my new console up to my room.', hint: 'E picks it up. Walk upstairs with it. Q returns a carried thing to where I picked it up.', test: 'carry.console' },
      { id: 'connect', text: 'Set it up beside the telly.', hint: 'Carry the console to the highlighted place beside my telly, then E connects it.', test: 'connect.console' },
      { id: 'play', text: 'First game on my own console. YES.', hint: 'Order a matching game if I need one. Put its case down, F opens it, E takes the game. E inserts it in the highlighted console slot; F plays.', test: 'play.console' },
      { id: 'mate', text: 'Add a mate to my phonebook. They need to hear about this.', hint: 'F uses my phone. Ask a JackNet mate for their private number, then Phonebook > Add name. Sending a text works too.', test: 'phone.mate' },
    ] },
    { id: 3, title: "Dad's old work PC", soon: true },
    { id: 4, title: 'Getting online upstairs', soon: true },
    { id: 5, title: 'The Collector', soon: true },
  ];
  const steps = chapters.flatMap(ch => (ch.steps || []).map(s => Object.assign({ ch: ch.id }, s)));
  const byId = Object.fromEntries(steps.map(s => [s.id, s]));
  const current = p => !p || p.flags?.veteran ? null : steps.find(s => !p.done[s.id]) || null;
  const cat = { chapters, steps, byId, current, version: 1 };
  if (typeof module !== 'undefined' && module.exports) module.exports = cat;
  else root.StoryCat = cat;
})(typeof window !== 'undefined' ? window : globalThis);
