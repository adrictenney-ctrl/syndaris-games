// Deal Maker on a phone: your hand, your sets and bank. Tap a card to see what you can do with
// it (bank it, lay it down, or play it — then pick who and what). When someone acts against you
// you can say Nope!; when you owe, tick the cards to pay with.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=66';
import { dmCard, setsHTML, bankTotal, pendingText } from './table-dealmaker.js?v=66';
import { CARDS, COLORS, ACTIONS, setSize } from './dealmaker.js?v=66';

let ctx = null, sel = null, step = null, picks = [], wasMyTurn = false;
const C = CARDS;
export function reset() { sel = null; step = null; picks = []; document.getElementById('dmPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
const complete = (g, s, col) => (g.props[s][col] || []).length >= setSize(col);
const loose = (g, s) => Object.entries(g.props[s]).filter(([col]) => !complete(g, s, col)).flatMap(([col, ids]) => ids.map(id => ({ id, col })));
const rentFor = (g, s, col) => { const n = Math.min((g.props[s][col] || []).length, setSize(col)); if (!n) return 0; let r = COLORS[col].rent[n - 1]; if (complete(g, s, col)) { if (g.builds[s][col]?.shop != null) r += 3; if (g.builds[s][col]?.tower != null) r += 4; } return r; };
const btn = (label, data, cls = '') => `<button class="panel-btn ${cls}" data-a='${JSON.stringify(data)}'>${label}</button>`;

function sheet(g, you) {
  const id = sel, c = C[id], others = g.order.filter(s => s !== you);
  const name = s => ctx.nameOf(s);
  if (!step) {
    let h = '';
    if (c.kind === 'money') h += btn(`Bank it (${c.val}M)`, { type: 'bank', id }, 'go');
    else if (c.kind === 'prop') h += c.colors.length > 1 ? c.colors.filter(k => !complete(g, you, k) || c.colors.length > 2).slice(0, 10).map(k => btn(`Lay as ${COLORS[k].name}`, { type: 'prop', id, color: k })).join('') : btn('Lay it down', { type: 'prop', id, color: c.colors[0] }, 'go');
    else {
      h += btn(`Bank it (${c.val}M)`, { type: 'bank', id });
      if (c.kind === 'rent' || !['nope', 'hike'].includes(c.act)) h += btn('Play it ▶', { step: 'play' }, 'go');
    }
    return h;
  }
  if (c.kind === 'rent') {
    const cols = c.colors.filter(k => rentFor(g, you, k));
    if (!cols.length) return '<p class="dm-note">You don’t own any of these colours yet.</p>';
    const hike = g.plays <= 1 && g.hand.find(x => C[x].act === 'hike');
    const targets = c.wild ? others : [null];
    return cols.flatMap(k => targets.map(t => {
      const base = { type: 'play', id, color: k, target: t };
      return btn(`${COLORS[k].name} rent ${rentFor(g, you, k)}M${t != null ? ` from ${name(t)}` : ''}`, base) + (hike != null ? btn(`…doubled: ${rentFor(g, you, k) * 2}M`, { ...base, hike }, 'go') : '');
    })).join('');
  }
  switch (c.act) {
    case 'payday': case 'party': return btn(c.act === 'payday' ? 'Draw two cards' : 'Everyone pays me 2M', { type: 'play', id }, 'go');
    case 'collect': return others.map(t => btn(`${name(t)} pays me 5M`, { type: 'play', id, target: t })).join('');
    case 'takeover': {
      const opts = others.flatMap(t => Object.keys(g.props[t]).filter(k => complete(g, t, k)).map(k => btn(`Take ${name(t)}’s ${COLORS[k].name}`, { type: 'play', id, target: t, color: k })));
      return opts.join('') || '<p class="dm-note">Nobody has a complete set yet.</p>';
    }
    case 'snatch': {
      const opts = others.flatMap(t => loose(g, t).map(p => btn(`${COLORS[p.col].name} from ${name(t)}`, { type: 'play', id, target: t, prop: p.id })));
      return opts.join('') || '<p class="dm-note">No properties to snatch.</p>';
    }
    case 'swap': {
      if (step === 'play') {
        const opts = others.flatMap(t => loose(g, t).map(p => btn(`Their ${COLORS[p.col].name} (${name(t)})`, { step: 'swap2', target: t, prop: p.id })));
        return opts.join('') || '<p class="dm-note">Nothing to swap for.</p>';
      }
      const mine = loose(g, you);
      return mine.map(p => btn(`Give my ${COLORS[p.col].name}`, { type: 'play', id, target: step.target, prop: step.prop, mine: p.id })).join('') || '<p class="dm-note">You need a property outside a complete set.</p>';
    }
    case 'shop': case 'tower': {
      const opts = Object.keys(g.props[you]).filter(k => complete(g, you, k) && k !== 'rail' && k !== 'util').map(k => btn(`On ${COLORS[k].name}`, { type: 'play', id, color: k }));
      return opts.join('') || '<p class="dm-note">You need a complete set (not railways or utilities).</p>';
    }
  }
  return '';
}

function el() {
  let e = document.getElementById('dmPhone');
  if (!e) {
    e = document.createElement('div');
    e.id = 'dmPhone';
    $('#status').after(e);
    e.addEventListener('click', ev => {
      const g = ctx.st.game, you = ctx.st.you;
      const h = ev.target.closest('[data-h]');
      if (h) { const id = Number(h.dataset.h); if (g.phase === 'discard') { picks = picks.includes(id) ? picks.filter(x => x !== id) : [...picks, id]; } else { sel = sel === id ? null : id; step = null; } return render(ctx); }
      const pk = ev.target.closest('[data-pay]');
      if (pk) { const id = Number(pk.dataset.pay); picks = picks.includes(id) ? picks.filter(x => x !== id) : [...picks, id]; return render(ctx); }
      const b = ev.target.closest('[data-a]');
      if (!b) return;
      const a = JSON.parse(b.dataset.a);
      if (a.step) { step = a.step === 'swap2' ? a : a.step; return render(ctx); }
      if (a.type === 'pay' || a.type === 'discard') { a.ids = picks; picks = []; }
      ctx.send(a);
      sel = null; step = null;
      navigator.vibrate?.(15);
    });
  }
  return e;
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  if (sel != null && !g.hand.includes(sel)) { sel = null; step = null; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  const sets = Object.keys(g.props[you]).filter(k => complete(g, you, k)).length;
  setHud('#hudL', 'Sets', `${sets}/3`);
  $('#hudC').innerHTML = g.turn === you && g.phase === 'play' ? `<span>Plays left</span><b>${3 - g.plays}</b>` : `<span>Bank</span><b>${bankTotal(g, you)}M</b>`;
  const lead = g.order.filter(s => s !== you).sort((a, b) => Object.keys(g.props[b]).filter(k => complete(g, b, k)).length - Object.keys(g.props[a]).filter(k => complete(g, a, k)).length)[0];
  setHud('#hudR', c.nameOf(lead), `${Object.keys(g.props[lead]).filter(k => complete(g, lead, k)).length}/3`, 'sets');
  const mineTurn = g.phase === 'play' && g.turn === you;
  const responding = g.phase === 'respond' && g.pending.responder === you;
  const paying = g.phase === 'pay' && g.pending.from === you;
  const discarding = g.phase === 'discard' && g.turn === you;
  const mine = mineTurn || responding || paying || discarding;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  if (!paying && !discarding) picks = [];

  const e = el();
  let top = `<div class="dm-mine">${setsHTML(g, you) || '<em>No properties yet</em>'}<span class="dm-bank">Bank ${bankTotal(g, you)}M</span></div>`;
  let mid = '';
  if (responding) mid = `<div class="dm-alert">${pendingText(g.pending, c.nameOf)}</div><div class="row">${btn('Nope! ✋', { type: 'nope' }, 'go')}${btn('Let it happen', { type: 'accept' })}</div>`;
  else if (paying) {
    const owned = [...g.bank[you], ...Object.values(g.props[you]).flat()].filter(id => C[id].val > 0);
    const tot = picks.reduce((t, id) => t + C[id].val, 0);
    mid = `<div class="dm-alert">You owe ${c.nameOf(g.pending.to)} <b>${g.pending.amount}M</b> (${g.pending.why}) — no change given</div>
      <div class="dm-paylist">${owned.map(id => `<button data-pay="${id}" class="${picks.includes(id) ? 'sel' : ''}">${dmCard(id, 'small')}</button>`).join('')}</div>
      <div class="row">${btn(`Pay ${tot}M`, { type: 'pay' }, 'go')}</div>`;
  } else if (discarding) mid = `<div class="dm-alert">Too many cards — discard ${g.hand.length - 7}</div><div class="row">${btn(`Discard ${picks.length}`, { type: 'discard' }, 'go')}</div>`;
  else if (mineTurn && sel != null) mid = `<div class="dm-sheet">${dmCard(sel)}<div class="dm-opts">${sheet(g, you)}</div></div>`;
  else if (g.pending) mid = `<div class="dm-alert dim">${pendingText(g.pending, c.nameOf)}</div>`;
  const hand = `<div class="dm-hand">${g.hand.map(id => `<button data-h="${id}" class="${sel === id || picks.includes(id) ? 'sel' : ''}">${dmCard(id)}</button>`).join('')}</div>`;
  e.innerHTML = top + mid + hand;
  const p = $('#panel');
  p.innerHTML = mineTurn ? btn('End my turn', { type: 'end' }, 'wide') : '';
  p.querySelector('[data-a]')?.addEventListener('click', () => { c.send({ type: 'end' }); sel = null; });
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (responding) setStatus('Nope! or let it happen?', 'Playing Nope! uses it up');
  else if (paying) setStatus('Time to pay', 'Tick bank cards or properties');
  else if (discarding) setStatus('Discard down to seven', 'Tap cards in your hand');
  else if (mineTurn) setStatus('Your turn', sel != null ? 'Choose what to do with it' : `Tap a card · ${3 - g.plays} play${3 - g.plays === 1 ? '' : 's'} left`);
  else setStatus(`${c.nameOf(D_turn(g))}'s move`, '');
  renderHand([]);
}
const D_turn = g => (g.phase === 'respond' ? g.pending.responder : g.phase === 'pay' ? g.pending.from : g.turn);
