/* Right-click anywhere on the PC gets a JackOS menu, never the real browser's. Specific menus (the web page,
 * desktop, taskbar, Explorer, programs...) are registered elsewhere and run first; this is the catch-all that
 * fills in the gaps: desktop icons, title bars, text boxes, toolbars, the Start menu, games and everything else. */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const label = el => ((el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title'))) || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const click = el => el && el.click();
  const dbl = el => el && el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

  // ---- text boxes: the classic edit menu, and it really works
  function editMenu(f) {
    const ro = f.readOnly || f.disabled, sel = f.selectionStart !== f.selectionEnd || !!(f.isContentEditable && String(getSelection()));
    const run = c => { f.focus(); try { document.execCommand(c); } catch (e) {} };
    return [
      { label: 'Undo', dis: ro, act: () => run('undo') }, '-',
      { label: 'Cut', dis: ro || !sel, act: () => run('cut') },
      { label: 'Copy', dis: !sel, act: () => run('copy') },
      { label: 'Paste', dis: ro || !(navigator.clipboard && navigator.clipboard.readText), act: () => navigator.clipboard.readText().then(t => { f.focus(); document.execCommand('insertText', false, t); }).catch(() => Desk.msgbox('Paste', 'The Clipboard is empty. (Or your browser won\'t let JackOS peek at it.)', 'info')) },
      { label: 'Delete', dis: ro || !sel, act: () => run('delete') }, '-',
      { label: 'Select All', act: () => { f.focus(); f.select ? f.select() : run('selectAll'); } },
    ];
  }

  // ---- title bars: the system menu
  function sysMenu(w) {
    const b = s => w.querySelector(s);
    if (w.id === 'browser') {
      const max = document.body.classList.contains('maxed');
      return [
        { label: 'Restore', dis: !max, act: () => click(b('#brMax')) }, { label: 'Move', dis: true }, { label: 'Size', dis: max },
        { label: 'Minimize', act: () => click(b('#brMin')) }, { label: 'Maximize', dis: max, act: () => click(b('#brMax')) }, '-',
        { label: 'Close', key: 'Alt+F4', act: () => click(b('#brClose')) },
      ];
    }
    const max = w.classList.contains('maxwin'), mx = b('[data-w=max]');
    return [
      { label: 'Restore', dis: !max || !mx, act: () => click(mx) }, { label: 'Move', dis: true }, { label: 'Size', dis: max || !mx },
      { label: 'Minimize', dis: !b('[data-w=min]'), act: () => click(b('[data-w=min]')) }, { label: 'Maximize', dis: max || !mx, act: () => click(mx) }, '-',
      { label: 'Close', key: 'Alt+F4', act: () => click(b('[data-w=close], .ctl button[aria-label=Close], .ctl i:last-child')) },
    ];
  }

  // ---- desktop icons
  function iconMenu(ic) {
    const name = label(ic.querySelector('span') || ic) || 'this';
    const bin = /recycle/i.test(name), comp = /my computer/i.test(name);
    return [
      { label: 'Open', act: () => { dbl(ic); click(ic); } },
      ...(comp || /documents|neighborhood/i.test(name) ? [{ label: 'Explore', act: () => { dbl(ic); click(ic); } }] : []),
      ...(bin ? [{ label: 'Empty Recycle Bin', act: () => { dbl(ic); click(ic); } }] : []),
      '-',
      { label: 'Send To', sub: [
        { label: '3\u00bd Floppy (A:)', act: () => Desk.msgbox('Copying...', `A:\\ is not accessible.\n\nThe device is not ready. (Is there a floppy in it? Is it the one with Dave's homework on?)`, 'warn') },
        { label: 'Desktop (create shortcut)', act: () => Desk.toast('Send To', `There's already a "${name}" on the desktop. It's right there. Look.`) },
        { label: 'Mail Recipient', act: () => Desk.toast('Send To', `Attaching "${name}" to an email... it's too big for a 56K modem. Maybe in 2005.`) },
        { label: 'My Briefcase', act: () => Desk.toast('My Briefcase', `"${name}" is now in your Briefcase. Don't forget it at school.`) },
      ] },
      '-', { label: 'Cut', dis: comp || bin }, { label: 'Copy', dis: comp || bin }, '-',
      { label: 'Create Shortcut', act: () => Desk.toast('Create Shortcut', `Shortcut to ${name} created. It's in the same place as the original. It's a shortcut to nowhere, really.`) },
      { label: 'Delete', dis: comp || bin, act: () => Desk.msgbox('Confirm File Delete', `Are you sure you want to send '${name}' to the Recycle Bin?`, 'q', [['Yes', () => Desk.msgbox('Cannot delete ' + name, `Cannot delete ${name}: Access is denied.\n\nJack needs this. Make sure the disk is not full or write-protected and that the file is not currently in use. And that Jack isn't looking.`, 'warn')], ['No']]) },
      { label: 'Rename', dis: comp || bin, act: () => Desk.toast('Rename', `${name} likes its name, thank you very much.`) }, '-',
      { label: 'Properties', act: () => Desk.msgbox(name + ' Properties', `${name}\n\nType: ${bin ? 'Recycle Bin' : comp ? 'System Folder' : 'Shortcut'}\nLocation: Desktop\nSize: ${(name.length * 37) % 900 + 64} bytes\nCreated: 01 January 1999, 00:00:01\n\nAttributes: [ ] Read-only  [ ] Hidden  [x] Archive`, 'info') },
    ];
  }

  // ---- toolbars of the browser
  function toolbarMenu() {
    const br = document.getElementById('browser'), has = c => !br.classList.contains(c);
    const tog = c => { br.classList.toggle(c); try { localStorage.setItem('jhp_bands', JSON.stringify(['no-std', 'no-addr', 'no-links', 'no-status'].filter(x => br.classList.contains(x)))); } catch (e) {} };
    return [
      { label: 'Standard Buttons', chk: has('no-std'), act: () => tog('no-std') }, { label: 'Address Bar', chk: has('no-addr'), act: () => tog('no-addr') },
      { label: 'Links', chk: has('no-links'), act: () => tog('no-links') }, { label: 'Radio', dis: true }, '-',
      { label: 'Customize...', act: () => Desk.msgbox('Customize Toolbar', 'Drag buttons around? What do you think this is, version 6? (JackNet Explorer 5 toolbars are perfect as they are.)', 'info') },
    ];
  }

  // ---- "What's This?" for everything else, like a JackOS 98 dialog
  const JOKES = ['It is a bit of the computer.', 'It does what it says. Mostly.', 'Jack made it. Please do not click. (You can click.)', 'This is very important to the running of JackOS. Probably.', 'Nobody knows what this does. Not even JackOS.', 'It\'s grey. Like everything else.'];
  function whatsThis(t, x, y) {
    const p = DesktopSurface.point(x, y); x = p.x; y = p.y;
    const name = label(t.closest('button,[role],a,label,.tb,.status,.group,.lg') || t) || 'This area';
    const tip = document.createElement('div');
    tip.className = 'whatsthis';
    tip.style.cssText = `position:fixed;left:${Math.max(4, Math.min(x, DesktopSurface.width() - 230))}px;top:${Math.max(4, Math.min(y, DesktopSurface.height() - 90))}px;z-index:2147483000;max-width:220px;background:#ffffe1;border:1px solid #000;padding:4px 6px;font:11px Tahoma,'MS Sans Serif',sans-serif;color:#000;box-shadow:2px 2px 0 rgba(0,0,0,.4)`;
    tip.innerHTML = `<b>${esc(name)}</b><br>${esc(JOKES[(name.length + name.charCodeAt(0)) % JOKES.length])}`;
    DesktopSurface.root().appendChild(tip);
    const gone = () => { tip.remove(); document.removeEventListener('pointerdown', gone, true); };
    setTimeout(() => document.addEventListener('pointerdown', gone, true), 0);
    setTimeout(gone, 6000);
  }

  window.addEventListener('contextmenu', ev => {
    if (ev.defaultPrevented) return; // someone else already showed a menu
    const t = ev.target && ev.target.closest ? ev.target : document.body;
    if (!DesktopSurface.root().contains(t)) return;
    ev.preventDefault();
    if (!window.IE || !IE.menu) return;
    const x = ev.clientX, y = ev.clientY, m = items => IE.menu(items, x, y);
    // games and drawing: the right button belongs to the program
    if (t.closest('canvas')) return;
    if (t.closest('.menu')) return;
    const f = t.closest('input[type=text],input[type=password],input[type=search],input[type=number],input:not([type]),textarea,[contenteditable=""],[contenteditable=true]');
    if (f) return m(editMenu(f));
    const ic = t.closest('.dicon');
    if (ic) { document.querySelectorAll('.dicon.sel').forEach(e => e.classList.remove('sel')); ic.classList.add('sel'); return m(iconMenu(ic)); }
    const tb = t.closest('#brTitleBar, .appwin > .tb, .appwin .tb, .float > .tb');
    if (tb && !t.closest('button')) { const w = tb.closest('#browser, .appwin, .float'); if (w) return m(sysMenu(w)); }
    if (t.closest('#browser') && t.closest('.rebar, .xbar, #menu')) return m(toolbarMenu());
    if (t.closest('#startMenu')) return m([{ label: 'Open', act: () => click(t.closest('button')) }, { label: 'Explore', act: () => Apps.open('explorer', 'C:/JACKOS/Start Menu') }, '-', { label: 'Sort by Name', act: () => Desk.toast('Start Menu', 'Sorted. Alphabetically. Except the ones that refused.') }, '-', { label: 'Properties', act: () => Apps.run('taskbar') || Desk.msgbox('Start Menu', 'The Start menu is where you start. And also where you shut down. Nobody knows why.', 'info') }]);
    const sel = String(getSelection());
    if (sel.trim()) return m([{ label: 'Copy', act: () => { try { document.execCommand('copy'); } catch (e) {} } }, { label: 'Select All', act: () => { try { document.execCommand('selectAll'); } catch (e) {} } }]);
    m([{ label: 'What\'s This?', act: () => whatsThis(t, x, y) }]);
  });
})();
