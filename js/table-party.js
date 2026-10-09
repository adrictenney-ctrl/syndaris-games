// The table side of the party games: one frame they all share. Each game supplies its engine
// and a center(g, ctx) that returns the middle of the table as HTML; this handles the rest —
// redrawing when something changes, the shared clock (.pt-clock, from g.endAt), sounds
// (g.sfx), scores on the name plates and the end-of-game card.
import { ding, buzzer, chime, sad, thud } from './sfx.js?v=68';
import { partyClock } from './table-dontsay.js?v=68';
import { esc, TEAMS } from './party.js?v=68';

const SFX = { ding, buzzer, chime, sad, thud };
export { esc, TEAMS };
export const sc = (g, ctx) => `<ol class="pt-rank">${[...g.order].sort((a, b) => g.score[b] - g.score[a]).map(s => `<li><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}<b>${g.score[s]}</b></li>`).join('')}</ol>`;
export const teamScores = g => `<div class="pt-scores">${[0, 1].map(t => `<div class="pt-score t${t} ${g.up === t && g.phase !== 'over' ? 'up' : ''}"><small>${TEAMS[t]}</small><b>${g.scores[t]}</b></div>`).join('')}</div>`;
export const who = (ctx, s) => `<span class="pt-who"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}</span>`;
export const clock = () => '<div class="pt-clock"></div>';
// Little "answered" chips for a phase where everyone answers at once.
export const doneRow = (g, ctx, set = g.order) => `<div class="pt-done">${set.map(s => `<span class="${g.done?.[s] ? 'on' : ''}"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}</span>`).join('')}</div>`;

export function partyTable(E, o) {
  let root = null, key = '', gref = null, clockT = null, lastSfx = 0;
  return {
    defaults: o.defaults || {},
    settingsHTML: o.settingsHTML || (() => ''),
    create: (settings, players) => E.createGame(settings, players),
    act: E.applyAction,
    bot: E.botAction,
    view: E.viewFor,
    turn: g => (E.turnSeat ? E.turnSeat(g) : -1),
    // Computer players: any bot that has something to do (E.pending lists the seats that do)
    // moves after a short pause, before the game's own clocks are looked at.
    timer: (g, players) => {
      if (players && E.pending && g.phase !== 'over') {
        const bots = E.pending(g).filter(x => players[x]?.bot), s = bots[0];
        // When everyone decides at once, the bots all decide together too.
        const all = E.collecting?.(g) ? bots : [s];
        if (s != null) return { ms: E.botDelay ? E.botDelay(g, s) : g.sel ? 500 : 900 + Math.random() * 700, run: () => {
          for (const b of all) {
            if (!E.pending(g).includes(b)) continue;
            // A bot may need a few taps (e.g. aim, then load) — keep going while it's still its move.
            for (let k = 0; k < 4 && E.pending(g).includes(b) && (k === 0 || E.collecting?.(g) || g.sel); k++) { const a = E.botAction(g, b); const err = a && E.applyAction(g, b, a); if (err || !a) { if (err) console.warn('bot move rejected:', err, a); break; } }
          }
        } };
      }
      return E.tick(g, players);
    },
    ink: (g, seat, msg) => (msg.draft && E.draft ? E.draft(g, seat, msg.draft) : false),
    joinMidGame: () => false,
    plate(g, s) {
      if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
      const badges = o.badges ? o.badges(g, s) : [];
      if (g.done && E.collecting?.(g) && g.order.includes(s)) badges.push(g.done[s] ? '<span class="badge got">✓ in</span>' : '<span class="badge">thinking…</span>');
      if (g.phase === 'over' && (g.winners || []).includes(s)) badges.push('<span class="badge got">🏆</span>');
      if (g.phase === 'over' && g.team && g.winner === g.team[s]) badges.push('<span class="badge got">🏆 winners</span>');
      const meta = g.team ? `<span class="pt-team t${g.team[s]}">● ${TEAMS[g.team[s]]}</span>` : `<span class="pt-pts">${g.score[s]} pt${g.score[s] === 1 ? '' : 's'}</span>`;
      return { badges, meta, cards: 0, turn: E.turnSeat ? E.turnSeat(g) === s && g.phase !== 'over' : false, out: false };
    },
    reset() { document.body.classList.remove('party-game'); root?.remove(); root = null; key = ''; clearInterval(clockT); clockT = null; },
    renderCenter(g, ctx) {
      gref = g;
      document.getElementById('watermark').textContent = '';
      if (!root) {
        root = document.createElement('div');
        root.id = 'partyT';
        root.className = 'pt-wrap pt-' + o.id;
        document.body.classList.add('party-game');
        document.getElementById('center').appendChild(root);
        clockT = partyClock(() => gref);
      }
      if (g.sfx && g.sfx.id !== lastSfx) { if (lastSfx) SFX[g.sfx.s]?.(); lastSfx = g.sfx.id; }
      const k = g.moveId + '|' + (o.key ? o.key(g) : '');
      if (k === key) return;
      key = k;
      root.innerHTML = o.center(g, ctx);
      o.after?.(root, g, ctx);
    },
    overlay(g, ctx) {
      if (g.phase !== 'over') return null;
      if (o.overlay) return o.overlay(g, ctx);
      let head, body;
      if (g.team) {
        head = g.winner == null ? "It's a tie!" : `${TEAMS[g.winner]} wins!`;
        body = `<p>${TEAMS[0]} ${g.scores[0]} · ${TEAMS[1]} ${g.scores[1]}</p>`;
      } else {
        head = g.winners.length > 1 ? `${g.winners.map(s => esc(ctx.nameOf(s))).join(' & ')} tie!` : `${esc(ctx.nameOf(g.winner))} wins!`;
        body = `<ol class="scores">${[...g.order].sort((a, b) => (o.low ? g.score[a] - g.score[b] : g.score[b] - g.score[a])).map(s => `<li>${esc(ctx.nameOf(s))} <b>${g.score[s]}</b></li>`).join('')}</ol>`;
      }
      return { key: 'over' + g.moveId, html: `<h2>${head}</h2>${body}<div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
    },
  };
}
