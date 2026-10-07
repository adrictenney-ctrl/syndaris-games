// Skyline on a player's phone: your turn's buttons (roll, buy, end turn, bail…), the deed for
// the square you're on, your own deeds (raise floors, sell, mortgage, pay off), and trades.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=53';
import { BOARD, DISTRICTS, PIECES, groupOf, canBuild, canSell, canMortgage, unmortgageCost } from './skyline.js?v=53';

let ctx = null, panelKey = '', wasMyTurn = false;
let trading = null;   // { to, give:Set, get:Set, giveCash, getCash } while building an offer
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const money = n => `$${Number(n).toLocaleString()}`;

export function reset() { panelKey = ''; trading = null; document.getElementById('slPhone')?.remove(); }

export function renderLobby(c) {
  const p = PIECES[c.st.you % PIECES.length];
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)} · plays the ${p.name} ${p.glyph}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  document.getElementById('slPhone')?.remove();
}

function el() {
  let e = document.getElementById('slPhone');
  if (!e) {
    e = document.createElement('div');
    e.id = 'slPhone';
    e.addEventListener('click', onClick);
    $('#status').after(e);
  }
  return e;
}

// A game-state view in the shape the rule helpers expect.
const asGame = g => ({ ...g, cash: g.cash, owner: g.owner, level: g.level, mortgaged: g.mortgaged });

function deed(i, g) {
  const t = BOARD[i];
  if (!['lot', 'metro', 'utility'].includes(t.kind)) return `<div class="sl-deed plain"><b>${esc(t.name)}</b><small>${{ payday: 'Collect $200 each time you pass', prison: g.inPrison[ctx.st.you] ? 'Roll doubles, pay $50 or use a pardon' : 'Just visiting', garden: 'Nothing happens here', fortune: 'Draw a Fortune card', tax: `Pay $${t.amount}`, arrest: 'Go straight to Prison' }[t.kind] || ''}</small></div>`;
  const o = g.owner[i];
  const head = t.kind === 'lot' ? `style="background:${DISTRICTS[t.d].color}"` : '';
  let rows = '';
  if (t.kind === 'lot') rows = ['Rent', 'With 1 floor', '2 floors', '3 floors', '4 floors', 'With a tower'].map((l, k) => `<li class="${g.level[i] === k && o != null ? 'cur' : ''}"><span>${l}</span><b>${money(t.rent[k])}</b></li>`).join('') + `<li class="note"><span>Whole district doubles bare rent · floors ${money(DISTRICTS[t.d].build)} each</span></li>`;
  else if (t.kind === 'metro') rows = [1, 2, 3, 4].map(n => `<li><span>${n} station${n > 1 ? 's' : ''}</span><b>${money(25 * 2 ** (n - 1))}</b></li>`).join('');
  else rows = '<li><span>One utility</span><b>4 × dice</b></li><li><span>Both utilities</span><b>10 × dice</b></li>';
  return `<div class="sl-deed"><header ${head}><small>${t.kind === 'lot' ? DISTRICTS[t.d].name : t.kind === 'metro' ? 'Metro station' : 'Utility'}</small><b>${esc(t.name)}</b></header>
    <ul>${rows}</ul><footer>${o == null ? `For sale · ${money(t.price)}` : `Owned by ${o === ctx.st.you ? 'you' : esc(ctx.nameOf(o))}${g.mortgaged[i] ? ' · mortgaged' : ''}`}</footer></div>`;
}

function myDeeds(g, you) {
  const G = asGame(g);
  const mine = BOARD.map((_, i) => i).filter(i => g.owner[i] === you);
  if (!mine.length) return '<p class="sl-none">No deeds yet — buy what you land on.</p>';
  return `<ul class="sl-deeds">${mine.map(i => {
    const t = BOARD[i];
    const color = t.kind === 'lot' ? DISTRICTS[t.d].color : t.kind === 'metro' ? '#8b8f96' : '#a6946b';
    const lv = g.level[i] === 5 ? '<em class="tower">tower</em>' : g.level[i] ? `<em>${g.level[i]} floor${g.level[i] > 1 ? 's' : ''}</em>` : '';
    const btns = [];
    if (t.kind === 'lot' && canBuild(G, you, i)) btns.push(`<button data-a="build" data-i="${i}">+ ${g.level[i] === 4 ? 'Tower' : 'Floor'} ${money(DISTRICTS[t.d].build)}</button>`);
    if (canSell(G, you, i)) btns.push(`<button data-a="sell" data-i="${i}">Sell floor +${money(DISTRICTS[t.d].build / 2)}</button>`);
    if (canMortgage(G, you, i)) btns.push(`<button data-a="mortgage" data-i="${i}">Mortgage +${money(t.price / 2)}</button>`);
    if (g.mortgaged[i]) btns.push(`<button data-a="unmortgage" data-i="${i}" ${g.cash[you] >= unmortgageCost(i) ? '' : 'disabled'}>Pay off ${money(unmortgageCost(i))}</button>`);
    return `<li class="${g.mortgaged[i] ? 'mort' : ''}"><i style="background:${color}"></i><span>${esc(t.name)}${lv}</span><div>${btns.join('')}</div></li>`;
  }).join('')}</ul>`;
}

function tradeBuilder(g, you) {
  const t = trading;
  const others = g.order.filter(s => s !== you && !g.broke[s]);
  const canGive = i => g.owner[i] != null && !(BOARD[i].kind === 'lot' && groupOf(BOARD[i].d).some(j => g.level[j]));
  const list = (owner, set, key) => BOARD.map((_, i) => i).filter(i => g.owner[i] === owner && canGive(i)).map(i => {
    const b = BOARD[i], color = b.kind === 'lot' ? DISTRICTS[b.d].color : '#8b8f96';
    return `<label class="${set.has(i) ? 'on' : ''}"><input type="checkbox" data-${key}="${i}" ${set.has(i) ? 'checked' : ''}><i style="background:${color}"></i>${esc(b.name)}</label>`;
  }).join('') || '<p class="sl-none">Nothing to trade</p>';
  const step = (key, max) => `<div class="sl-cash"><button data-c="${key}" data-d="-50">−</button><b>${money(t[key])}</b><button data-c="${key}" data-d="50" ${t[key] + 50 > max ? 'disabled' : ''}>+</button></div>`;
  return `<div class="sl-trade">
    <p class="pick">Trade with</p>
    <div class="row">${others.map(s => `<button class="panel-btn who ${s === t.to ? 'on' : ''}" data-to="${s}">${esc(ctx.nameOf(s))}</button>`).join('')}</div>
    ${t.to == null ? '' : `<div class="sl-cols">
      <div><p class="pick">You give</p>${list(you, t.give, 'give')}${step('giveCash', g.cash[you])}</div>
      <div><p class="pick">You get</p>${list(t.to, t.get, 'get')}${step('getCash', g.cash[t.to])}</div>
    </div>`}
    <div class="row"><button class="panel-btn" data-x="close">Cancel</button><button class="panel-btn go" data-x="send" ${t.to != null && (t.give.size || t.get.size) ? '' : 'disabled'}>Send offer</button></div>
  </div>`;
}

function offerCard(g, you) {
  const t = g.trade;
  const names = a => a.map(i => esc(BOARD[i].name)).join(', ');
  const mine = t.to === you;
  const giveSide = [t.give.length ? names(t.give) : '', t.giveCash ? money(t.giveCash) : ''].filter(Boolean).join(' + ') || 'nothing';
  const getSide = [t.get.length ? names(t.get) : '', t.getCash ? money(t.getCash) : ''].filter(Boolean).join(' + ') || 'nothing';
  return `<div class="sl-offer"><p class="pick">${mine ? `${esc(ctx.nameOf(t.from))} offers you` : `Your offer to ${esc(ctx.nameOf(t.to))}`}</p>
    <p><b>${mine ? 'You get' : 'You give'}:</b> ${giveSide}</p><p><b>${mine ? 'You give' : 'You get'}:</b> ${getSide}</p>
    <div class="row">${mine ? '<button class="panel-btn fold" data-x="decline">Decline</button><button class="panel-btn go" data-x="accept">Accept</button>' : '<button class="panel-btn" data-x="cancel">Withdraw offer</button>'}</div></div>`;
}

function onClick(e) {
  const g = ctx.st.game;
  const b = e.target.closest('button, input');
  if (!b) return;
  if (b.dataset.a) { ctx.send({ type: b.dataset.a, i: Number(b.dataset.i) }); navigator.vibrate?.(12); return; }
  if (b.dataset.to) { trading.to = Number(b.dataset.to); trading.get = new Set(); trading.getCash = 0; draw(); return; }
  if (b.dataset.give) { toggle(trading.give, Number(b.dataset.give)); return draw(); }
  if (b.dataset.get) { toggle(trading.get, Number(b.dataset.get)); return draw(); }
  if (b.dataset.c) { trading[b.dataset.c] = Math.max(0, trading[b.dataset.c] + Number(b.dataset.d)); return draw(); }
  const x = b.dataset.x;
  if (x === 'close') { trading = null; return draw(); }
  if (x === 'send') { ctx.send({ type: 'offer', to: trading.to, give: [...trading.give], get: [...trading.get], giveCash: trading.giveCash, getCash: trading.getCash }); trading = null; return; }
  if (x === 'accept' || x === 'decline' || x === 'cancel') return ctx.send({ type: x });
  if (x === 'trade') { trading = { to: null, give: new Set(), get: new Set(), giveCash: 0, getCash: 0 }; return draw(); }
  if (b.dataset.do) { ctx.send({ type: b.dataset.do }); navigator.vibrate?.(15); }
}
const toggle = (set, i) => (set.has(i) ? set.delete(i) : set.add(i));
const draw = () => render(ctx, true);

export function render(c) {
  ctx = c;
  const g = c.st.game;
  const you = c.st.you;
  const piece = PIECES[you % PIECES.length];
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · ${piece.glyph} ${piece.name}`;
  setHud('#hudL', 'Cash', money(g.cash[you]), g.pardons[you] ? `${g.pardons[you]} pardon` : '');
  $('#hudC').innerHTML = g.rounds ? `<span>Round</span><b>${Math.min(g.round, g.rounds)}</b><em class="of">of ${g.rounds}</em>` : `<span>Round</span><b>${g.round}</b>`;
  setHud('#hudR', 'Worth', money(g.worth[g.order.indexOf(you)] ?? 0));

  const me = g.turn === you && g.phase !== 'over' && !g.broke[you];
  const inDebt = g.debt?.seat === you;
  document.body.classList.toggle('myturn', me || inDebt);
  if ((me || inDebt) && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = me || inDebt;
  if (!me) trading = null;

  const here = BOARD[g.pos[you]];
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You own the skyline!' : `${c.nameOf(g.winner)} wins`, g.byWorth ? 'Richest after the final round' : 'Last one standing');
  else if (g.broke[you]) setStatus('Bankrupt', 'Watch the rest of the game on the table');
  else if (inDebt) setStatus(`You owe ${money(-g.cash[you])}`, 'Sell floors or mortgage deeds below — or declare bankruptcy');
  else if (g.trade?.to === you) setStatus('A trade offer!', 'Have a look below');
  else if (!me) setStatus(`${c.nameOf(g.turn)}'s turn`, g.debt ? `${c.nameOf(g.debt.seat)} is raising money` : '');
  else if (g.phase === 'roll') setStatus(g.inPrison[you] ? "You're in Prison" : g.doubles ? 'Doubles! Roll again' : 'Your turn', g.inPrison[you] ? 'Roll doubles to get out, pay $50 bail, or use a pardon' : 'Roll the dice');
  else if (g.phase === 'buy') setStatus(`${here.name} is for sale`, `${money(here.price)} · you have ${money(g.cash[you])}`);
  else setStatus(here.name, 'Build, trade or end your turn');

  // Main buttons
  const key = [g.phase, me, inDebt, g.inPrison[you], g.pardons[you], g.cash[you] >= (here.price || 0), !!g.trade, trading ? 1 : 0, g.doubles].join('|');
  if (key !== panelKey) {
    panelKey = key;
    const p = $('#panel');
    let h = '';
    if (inDebt) h = '<button class="panel-btn fold wide" data-do="bankrupt">Declare bankruptcy</button>';
    else if (me && !trading && !g.trade) {
      if (g.phase === 'roll') {
        h = '<button class="panel-btn go wide" data-do="roll">Roll the dice</button>';
        if (g.inPrison[you]) h += `<div class="row"><button class="panel-btn" data-do="bail" ${g.cash[you] >= 50 ? '' : 'disabled'}>Pay $50 bail</button>${g.pardons[you] ? '<button class="panel-btn" data-do="pardon">Use pardon</button>' : ''}</div>`;
      } else if (g.phase === 'buy') {
        h = `<div class="row"><button class="panel-btn" data-do="pass">Pass</button><button class="panel-btn go" data-do="buy" ${g.cash[you] >= here.price ? '' : 'disabled'}>Buy · ${money(here.price)}</button></div>`;
      } else if (g.phase === 'end') {
        h = `<div class="row"><button class="panel-btn" data-x="trade">Trade</button><button class="panel-btn go" data-do="end">${g.doubles && !g.inPrison[you] ? 'Roll again' : 'End turn'}</button></div>`;
      }
    }
    p.innerHTML = h;
    p.onclick = onClick;
  }

  // Deed, offers, trade builder, your deeds
  const box = el();
  let html = '';
  if (g.card && g.card.seat === you && me) html += `<div class="sl-fortune"><small>Fortune</small><p>${esc(g.card.text)}</p></div>`;
  if (g.trade && (g.trade.to === you || g.trade.from === you)) html += offerCard(g, you);
  else if (trading) html += tradeBuilder(g, you);
  else if (!g.broke[you]) html += deed(g.pos[you], g);
  html += `<p class="pick sl-h">Your deeds</p>${myDeeds(g, you)}`;
  box.innerHTML = html;

  renderHand([]);
}
