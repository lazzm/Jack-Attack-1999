/* Story objectives: shared by Node and the browser. Tests describe evidence, never pay. */
(function (root) {
  'use strict';
  const chapters = [
    { id: 1, title: 'Just a Game Lad', steps: [
      { id: 'lad', text: 'One quick go on my Game Lad.', hint: 'F plays the Game Lad. E carries, R turns, Q leans back. Enter starts the game.', test: 'play.gb', targets: ['gb'] },
      { id: 'meetmom', text: 'Mom is coming up the stairs. Better look busy.', hint: 'Talk to Mom with F. She is at my bedroom door.', test: 'talk.mom', targets: ['np.mom'] },
      { id: 'tidy', text: 'Mom wants my room tidy first.', hint: 'Clothes in the basket, rubbish in the bin, dishes in the kitchen sink.', test: 'chore.tidy', targets: ['ch.list.bedroom', 'ch.s.basket', 'ch.s.bin', 'ch.s.sink'] },
      { id: 'bed', text: 'Make the bed. A duvet heap does not count.', hint: 'E carries the pillow and pyjamas to their places. F straightens the duvet.', test: 'chore.bed', targets: ['ch.pillow', 'ch.pjs', 'bed'] },
      { id: 'bin', text: 'Take my bin bag downstairs.', hint: 'F ties the bag. E carries it to the kitchen bin; E puts it in.', test: 'chore.bin', targets: ['ch.binbag', 'ch.s.kbin'] },
      { id: 'dad', text: 'Dad is home! Meet him at the car.', hint: 'F opens doors. Follow the stairs to the hall, then the front door to the drive.', test: 'room.drive', targets: ['st.boot'] },
      { id: 'boot', text: "Open the boot of Dad's car.", hint: 'F opens the boot. There is an entire computer in there!', test: 'physical.boot', targets: ['st.boot'] },
      ...['tower', 'monitor', 'keys', 'speakers'].map((part, i) => ({ id: 'part.' + part, text: ['Carry the tower up to my desk.', 'Careful! Carry the heavy monitor upstairs.', 'Bring up the keyboard and mouse.', 'Last trip: the speakers.'][i], hint: 'E picks it up. R turns it. Carry it upstairs, aim at the marked place on my desk and E sets it down. Q returns it safely.', test: 'physical.part.' + part, targets: ['st.pc.' + part] })),
      ...['power', 'video', 'keyboard'].map((lead, i) => ({ id: 'lead.' + lead, text: ['Plug in the power lead.', 'Connect the monitor lead.', 'Connect the keyboard lead.'][i], hint: 'F plugs the marked connector into its matching port. The mouse and speakers are already paired.', test: 'physical.lead.' + lead, targets: ['st.lead.' + lead] })),
      { id: 'power', text: 'The big moment. Press the power button.', hint: 'F at the tower switches it on. Dad left the JackOS recovery floppies beside it.', test: 'physical.power', targets: ['pc.power'] },
      { id: 'install', text: 'Install JackOS from the recovery floppies.', hint: 'Follow JackOS Setup on the monitor. Insert each numbered recovery disk when asked.', test: 'physical.install', targets: ['pc'] },
      { id: 'pc', text: 'Log on to JackNet. My own PC!', hint: 'Finish Setup and log on to the desktop. Time to save for a console.', test: 'pc.use', targets: ['pc'] },
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
    { id: 3, title: 'Getting online upstairs', soon: true },
    { id: 4, title: 'The Collector', soon: true },
  ];
  const steps = chapters.flatMap(ch => (ch.steps || []).map(s => Object.assign({ ch: ch.id }, s)));
  const byId = Object.fromEntries(steps.map(s => [s.id, s]));
  // Assembly has real prerequisites, but independent parts/leads and all chores
  // may be done in any order. Never use the diary's display order as a gate.
  const requires = { boot: ['dad'], power: ['lead.power', 'lead.video', 'lead.keyboard'], install: ['power'], pc: ['install'] };
  for (const part of ['tower', 'monitor', 'keys', 'speakers']) requires['part.' + part] = ['boot'];
  for (const lead of ['power', 'video', 'keyboard']) requires['lead.' + lead] = ['part.tower', 'part.monitor', 'part.keys', 'part.speakers'];
  const ready = (p, s) => !!p && (requires[s.id] || []).every(id => !!p.done[id]);
  const current = p => !p || p.flags?.veteran ? null : steps.find(s => !p.done[s.id]) || null;
  const cat = { chapters, steps, byId, current, ready, version: 2 };
  if (typeof module !== 'undefined' && module.exports) module.exports = cat;
  else root.StoryCat = cat;
})(typeof window !== 'undefined' ? window : globalThis);
