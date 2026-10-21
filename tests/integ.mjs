import { chromium } from 'playwright';
const S='/tmp/claude-1000/-home-jackm/acf34d18-dce6-4034-9475-8fd25412d781/scratchpad';
const PORT = process.argv[2] || '18081';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args:['--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const errs=[];
async function mk(vp, mobile) {
  const ctx = await browser.newContext(mobile ? { viewport: vp, isMobile: true, hasTouch: true } : { viewport: vp });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push((mobile?'[m] ':'')+'PAGEERROR '+e.message));
  page.on('console', m => { if (m.type()==='error' && !/Failed to load resource.*(404|favicon)/.test(m.text())) errs.push((mobile?'[m] ':'')+'CONSOLE '+m.text().slice(0,200)); });
  page.on('response', r => { if (r.status() >= 400) errs.push('HTTP '+r.status()+' '+r.url()); });
  return page;
}
const clean = p => p.evaluate(()=>{ document.querySelectorAll('.msgbox .btn').forEach(b=>b.click()); document.querySelectorAll('.appwin [data-w=close]').forEach(b=>b.click()); IE.closeMenus && IE.closeMenus(); });
// 1. full boot, desktop
const a = await mk({ width: 1366, height: 860 });
await a.goto(`http://localhost:${PORT}/`); await a.waitForTimeout(1500);
const pw = await a.$('#power, .powerbtn, [id*=power]'); if (pw) { await pw.click().catch(()=>{}); }
await a.waitForTimeout(25000);
await a.screenshot({ path: S+'/shots/i-boot.png' });
const logonVisible = await a.evaluate(()=>!!document.querySelector('.jl, #jnLogon, .jlogon, [class*=logon]') );
console.log('boot done; logon element present:', logonVisible);
// guest
await a.evaluate(()=>{ const b=[...document.querySelectorAll('button')].find(b=>/guest/i.test(b.textContent)&&b.offsetParent); if (b) b.click(); });
await a.waitForTimeout(12000); await a.screenshot({ path: S+'/shots/i-desk.png' });
await clean(a);
// 2. run lots of programs
const cmds = ['notepad','mspaint','calc','jackamp','explorer','outlook','defrag','scandisk','regedit','control','sol','freecell','command','jbasic','grotquest','pinball','skigrot','hearts','spider','chess','reversi','grotlings','zone','jackcarta','mplayer','cdplayer','typing','stampstudio','uhoh','whiteboard','fridge','radio','irc','taskmgr','devmgr','sysmon','winhelp','themes','printers','wordpad','jackcalc','cardfile','hypertrm','progman','clock','magnify','welcome','teef','grotville','pinball','winmine','grotball','pagebuilder','davezip','autorun','grotdot','grotfax','squigtalk','fishtank'];
for (const c of cmds) { const ok = await a.evaluate(c => { try { return Apps.run(c); } catch (e) { return 'ERR '+e.message; } }, c); if (ok !== true) console.log('run', c, '->', ok); await a.waitForTimeout(350); }
await a.waitForTimeout(3000);
const nw = await a.evaluate(()=>document.querySelectorAll('.appwin').length); console.log('windows open', nw);
await a.screenshot({ path: S+'/shots/i-many.png' });
await clean(a); await a.waitForTimeout(500); await clean(a);
// 3. website sections + fake sites
for (const w of ['home','hangout','demos','reviews','cheats','orks','letters','art','chat','forums','members','starwars','comics','top10','quiz','polls','downloads','links','saver','www.davesplace.jnet','www.jacknetzone.jnet','www.grotsearch.find','area51','www.lookhere.jnet','www.teefemporium.grot','www.grotville.jnet','www.squigexchange.grot','www.jacknetbank.webcom','www.sharewareshack.netz','http://www.sharewareshack.netz/soft/jackamp.html','www.waaaghooo.find','www.jackgle.find','www.askgubbinz.find','www.grotdot.jnet','www.grotbay.webcom','www.squigwitch.cyb','www.grotbo.netz','www.grotfaqs.w3b','http://members.homepagez.webcom/directory.html','links']) { await a.evaluate(w=>IE.navigate(w), w); await a.waitForTimeout(700); }
await a.screenshot({ path: S+'/shots/i-site.png' });
// 4. phone
const m = await mk({ width: 390, height: 844 }, true);
await m.goto(`http://localhost:${PORT}/?noboot&allsoft`); await m.waitForTimeout(3000); await clean(m);
for (const w of ['home','hangout','reviews','www.davesplace.jnet','www.sharewareshack.netz','www.waaaghooo.find','www.grotdot.jnet','links']) { await m.evaluate(w=>IE.navigate(w), w); await m.waitForTimeout(700); }
await m.evaluate(()=>Apps.run('pinball')); await m.waitForTimeout(1500);
await m.screenshot({ path: S+'/shots/i-phone.png' });
console.log(errs.length ? [...new Set(errs)].join('\n') : 'NO ERRORS');
await browser.close();
