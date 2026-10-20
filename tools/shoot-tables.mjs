// Photographs every game's table for the home page tablets: tables/<id>-c.webp (Classic) and
// tables/<id>-v.webp (Vibrant). Each table gets bots in every seat and the game started, so the
// picture shows the game being played, then the menus and corner controls are hidden.
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
  return { send, js, close: () => { ws.close(); proc.kill(); } };
}

async function shoot(b, id, style) {
  await b.send('Page.navigate', { url: `${site}/icon.svg` });
  await wait(300);
  await b.js(`localStorage.clear(); localStorage.setItem('pod.style', '${style}'); localStorage.setItem('pod.owned', '["classic"]'); localStorage.setItem('syndaris.table.upright', '0')`);
  await b.send('Page.navigate', { url: `${site}/table.html?game=${id}` });
  for (let i = 0; i < 40; i++) { await wait(150); if (await b.js(`!!document.querySelector('.seat') && document.body.classList.contains('in-lobby')`)) break; }
  await wait(600);
  // Bots in every seat, then start (games where bots can't play just show their seats).
  await b.js(`document.querySelectorAll('.seat.empty .addbot').forEach(x => x.click())`);
  await wait(300);
  const started = await b.js(`(() => { const s = document.getElementById('startBtn'); if (s.disabled) return false; s.click(); return true; })()`);
  if (started) await wait(3200);
  await b.js(`(() => { const st = document.createElement('style'); st.textContent = ${JSON.stringify(HIDE)}; document.head.appendChild(st); })()`);
  await wait(250);
  const shot = await b.send('Page.captureScreenshot', { format: 'webp', quality: 72, clip: { x: 0, y: 0, width: W, height: H, scale: SCALE } });
  writeFileSync(new URL(`${id}-${style[0]}.webp`, OUT), Buffer.from(shot.data, 'base64'));
  return started;
}

const work = styles.flatMap(s => ids.map(id => [id, s]));
let done = 0;
const notStarted = [];
await Promise.all(Array.from({ length: Math.min(jobs, work.length) }, async (_, j) => {
  const b = await browser(9600 + j);
  for (let w; (w = work.shift());) {
    try { if (!(await shoot(b, ...w))) notStarted.push(w.join(' ')); }
    catch (e) { console.log('failed', w.join(' '), e.message); }
    if (++done % 20 === 0) console.log(`${done} pictures`);
  }
  b.close();
}));
console.log(`Done: ${done} pictures in tables/`);
if (notStarted.length) console.log(`Shown at the lobby (couldn't start with bots): ${notStarted.join(', ')}`);
