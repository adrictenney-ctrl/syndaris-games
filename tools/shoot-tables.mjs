// Photographs every game's table for the home page tablets: tables/<id>-c.webp (Classic) and
// tables/<id>-v.webp (Vibrant). Each table gets bots in every seat and the game started; the bots
// play (on a sped-up clock) and the picture is taken from halfway through, with the menus and corner
// controls hidden.
//
// Needs Chrome and the site running locally (the "table" server in .claude/launch.json, port 8090).
//   node tools/shoot-tables.mjs                 every game, both styles
//   node tools/shoot-tables.mjs gofish chess    just these games
// Options: --styles=classic,vibrant  --jobs=4  --port=8090
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GAMES } from '../js/games.js';

const args = process.argv.slice(2);
const opt = (k, d) => (args.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const ids = args.filter(a => !a.startsWith('--')).length ? args.filter(a => !a.startsWith('--')) : Object.keys(GAMES);
const styles = opt('styles', 'classic,vibrant').split(',');
const jobs = +opt('jobs', 4), site = `http://localhost:${opt('port', 8090)}`;
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
const OUT = new URL('../tables/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));

// The picture: 1280x720 table, saved at 480x270.
const W = 1280, H = 720, SCALE = 480 / 1280;
const HIDE = `#lobby, #toolbar, #overlay, #rulesPanel, #btnTool, .seat-actions, .bubble, #qrMini { display: none !important; }
  *, *::before, *::after { animation-play-state: paused !important; }`;
// Halfway through a game: the page's clock runs WARP times fast so the bots get well into it.
const WARP = 8, STEP_MS = 650, STEPS = 30;   // up to about 2.5 minutes of game time
const WARP_JS = `(() => { const F = ${WARP}, rn = Date.now.bind(Date), pn = performance.now.bind(performance), r0 = rn(), p0 = pn();
  Date.now = () => r0 + (rn() - r0) * F; performance.now = () => p0 + (pn() - p0) * F;
  const st = setTimeout, si = setInterval;
  window.setTimeout = (f, d = 0, ...a) => st(f, d / F, ...a); window.setInterval = (f, d = 0, ...a) => si(f, d / F, ...a); })()`;

async function browser(port) {
  const exe = CHROME.find(p => existsSync(p)) || CHROME[0];
  const proc = spawn(exe, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'shoot-'))}`,
    '--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
  let tabs;
  for (let i = 0; i < 60 && !tabs; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await wait(250); } }
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let n = 0; const pending = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if (pending[m.id]) { pending[m.id](m.result); delete pending[m.id]; } };
  const send = (method, params = {}) => new Promise(r => { const k = ++n; pending[k] = r; ws.send(JSON.stringify({ id: k, method, params })); });
  const js = expression => send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }).then(r => r?.result?.value);
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: WARP_JS });
  return { send, js, close: () => { ws.close(); proc.kill(); } };
}

async function shoot(b, id, style) {
  await b.send('Page.navigate', { url: `${site}/icon.svg` });
  await wait(300);
  await b.js(`localStorage.clear(); localStorage.setItem('pod.style', '${style}'); localStorage.setItem('pod.owned', '["classic"]'); localStorage.setItem('syndaris.table.upright', '0')`);
  await b.send('Page.navigate', { url: `${site}/table.html?game=${id}` });
  // Wait for the table to draw (a busy machine can take a while); no seats means try again.
  let ready = false;
  for (let i = 0; i < 130 && !ready; i++) { await wait(150); ready = await b.js(`!!document.querySelector('.seat') && document.body.classList.contains('in-lobby')`); }
  if (!ready) return 'retry';
  await wait(600);
  // As many bots as the game takes, spread around the table, then start (games where bots can't
  // play just show their seats).
  const G = GAMES[id], seats = G.layout.length, n = Math.min(G.max, seats);
  const botSeats = [...new Set(Array.from({ length: n }, (_, i) => Math.round(i * seats / n)))];
  await b.js(`(() => { const all = document.querySelectorAll('.seat'); ${JSON.stringify(botSeats)}.forEach(i => all[i]?.querySelector('.addbot')?.click()); })()`);
  await wait(300);
  const started = await b.js(`(() => { const s = document.getElementById('startBtn'); if (s.disabled) return false; s.click(); return true; })()`);
  await b.js(`(() => { const st = document.createElement('style'); st.textContent = ${JSON.stringify(HIDE)}; document.head.appendChild(st); })()`);
  const snap = async () => (await b.send('Page.captureScreenshot', { format: 'webp', quality: 72, clip: { x: 0, y: 0, width: W, height: H, scale: SCALE } })).data;
  let pick;
  if (!started) { await wait(300); pick = await snap(); }
  else {
    // Let the bots play (the clock runs WARP times fast), snapshot every few game-seconds until the
    // game ends, then keep the snapshot from the middle (frames showing a scoring slip don't count).
    const frames = [];
    let over = 0;
    for (let i = 0; i < STEPS; i++) {
      await wait(STEP_MS);
      const st = await b.js(`({ lobby: document.body.classList.contains('in-lobby'), slip: !document.getElementById('overlay').hidden })`);
      if (st.lobby) break;
      over = st.slip ? over + 1 : 0;
      if (over >= 4) break;            // the final scores are up: the game is over
      if (!st.slip) frames.push(await snap());
    }
    pick = frames[Math.floor(frames.length / 2)] || await snap();
  }
  // A picture of an empty table (about 3.7 KB) means the game never drew: try again.
  if (!pick || pick.length < 7000 || !(await b.js(`document.querySelectorAll('.seat').length > 0`))) return 'retry';
  writeFileSync(new URL(`${id}-${style[0]}.webp`, OUT), Buffer.from(pick, 'base64'));
  return started;
}

const work = styles.flatMap(s => ids.map(id => [id, s]));
let done = 0;
const notStarted = [];
await Promise.all(Array.from({ length: Math.min(jobs, work.length) }, async (_, j) => {
  const b = await browser(9600 + j);
  for (let w; (w = work.shift());) {
    try {
      let ok = 'retry';
      for (let t = 0; t < 4 && ok !== true; t++) ok = await shoot(b, ...w);   // a busy machine can miss the start; try again
      if (ok === 'retry') console.log('no picture', w.join(' '));
      else if (!ok) notStarted.push(w.join(' '));
    }
    catch (e) { console.log('failed', w.join(' '), e.message); }
    if (++done % 20 === 0) console.log(`${done} pictures`);
  }
  b.close();
}));
console.log(`Done: ${done} pictures in tables/`);
if (notStarted.length) console.log(`Shown at the lobby (couldn't start with bots): ${notStarted.join(', ')}`);
