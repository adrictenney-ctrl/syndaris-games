// Crown & Dagger on a phone: your secret role (hold to peek), your vote, and the edicts
// when you're Regent or Steward.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=62';
import { POWER_TEXT } from './crown.js?v=62';
import { CROWN, DAGGER, edict, fmt } from './table-crown.js?v=62';

let ctx = null, panelKey = '', roleKey = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ROLE = {
  loyal: { name: 'Loyalist', side: 'You are loyal to the Crown.', goal: 'Enact 5 Loyal edicts, or banish the Usurper.' },
  consp: { name: 'Conspirator', side: 'You are part of the Conspiracy.', goal: 'Enact 6 Dagger edicts, or get the Usurper approved as Steward after 3 Dagger edicts.' },
  usurper: { name: 'The Usurper', side: 'You lead the Conspiracy in secret.', goal: 'Stay hidden. Get yourself approved as Steward once 3 Dagger edicts are in force.' },
};

export function reset() { panelKey = roleKey = ''; document.getElementById('cdRole')?.remove(); }

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', null); setHud('#hudC', null); setHud('#hudR', null);
  document.getElementById('cdRole')?.remove();
}

// The role card hides itself: press and hold to look, so neighbors can't glance at it.
function roleCard(v) {
  let el = document.getElementById('cdRole');
  const k = JSON.stringify([v.role, v.allies]);
  if (el && k === roleKey) return;
  roleKey = k;
  if (!el) {
    el = document.createElement('div');
    el.id = 'cdRole';
    $('#status').after(el);
    const show = on => el.classList.toggle('peek', on);
    el.addEventListener('pointerdown', () => show(true));
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => el.addEventListener(t, () => show(false)));
  }
  if (!v.role) { el.innerHTML = '<div class="cd-back"><b>Watching</b><span>You joined after the roles were dealt.</span></div>'; return; }
  const r = ROLE[v.role];
  const allies = v.allies.length ? `<p class="cd-allies">${v.role === 'usurper' ? 'Your Conspirators' : 'Your side'}: ${v.allies.map(a => `<b>${esc(ctx.nameOf(a.seat))}</b>${a.role === 'usurper' ? ' (the Usurper)' : ''}`).join(', ')}</p>`
    : v.role === 'usurper' ? '<p class="cd-allies">In a game this size you don\'t know who your Conspirators are, but they know you.</p>' : '';
  el.innerHTML = `
    <div class="cd-back">${CROWN}<b>Hold to see your role</b><span>Keep it hidden from everyone else</span></div>
    <div class="cd-face ${v.role}">${v.role === 'loyal' ? CROWN : DAGGER}<small>Your secret role</small><h3>${r.name}</h3><p>${r.side}</p><p class="goal">${r.goal}</p>${allies}</div>`;
}

function pickList(list, label, onPick) {
  return { html: `<div class="cd-pick">${list.map(s => `<button class="panel-btn" data-s="${s}">${esc(ctx.nameOf(s))}</button>`).join('')}</div><p class="cd-hint">${label}</p>`, onPick };
}

function renderPanel(v) {
  const you = v.me;
  const k = JSON.stringify([v.phase, v.round, v.myVote, v.hand, v.power, v.seen, v.eligible, v.vetoOpen, v.targets]);
  if (k === panelKey) return;
  panelKey = k;
  const p = $('#panel');
  p.innerHTML = '';
  const send = a => ctx.send(a);
  let wire = null;
  if (v.phase === 'nominate' && v.regent === you) {
    const r = pickList(v.eligible, 'Choose your Steward. The last Regent and Steward can\'t be picked.', s => send({ type: 'nominate', s }));
    p.innerHTML = r.html; wire = r.onPick;
  } else if (v.phase === 'vote' && v.alive[you]) {
    p.innerHTML = `<div class="cd-votes">
      <button class="cd-vote aye ${v.myVote === true ? 'on' : ''}" data-v="1">Aye<small>approve</small></button>
      <button class="cd-vote nay ${v.myVote === false ? 'on' : ''}" data-v="0">Nay<small>refuse</small></button></div>
      <p class="cd-hint">${v.myVote === null ? 'Votes are shown on the table once everyone has voted.' : 'You can still change your vote until everyone has voted.'}</p>`;
    p.querySelectorAll('[data-v]').forEach(b => { b.onclick = () => { navigator.vibrate?.(15); send({ type: 'vote', aye: b.dataset.v === '1' }); }; });
  } else if (v.hand && v.phase === 'regentLegis') {
    p.innerHTML = `<div class="cd-hand">${v.hand.map((c, i) => edict(c, `data-i="${i}" role="button"`)).join('')}</div><p class="cd-hint">Tap the edict to <b>discard</b>. The other two go to the Steward.</p>`;
    p.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => send({ type: 'discard', i: Number(b.dataset.i) }); });
  } else if (v.hand && v.phase === 'stewardLegis') {
    p.innerHTML = `<div class="cd-hand">${v.hand.map((c, i) => edict(c, `data-i="${i}" role="button"`)).join('')}</div><p class="cd-hint">Tap the edict to <b>enact</b>.</p>
      ${v.vetoOpen ? '<button class="panel-btn wide" id="cdVeto">Ask the Regent to veto both</button>' : ''}`;
    p.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => send({ type: 'enact', i: Number(b.dataset.i) }); });
    $('#cdVeto')?.addEventListener('click', () => send({ type: 'veto' }));
  } else if (v.phase === 'veto' && v.regent === you) {
    p.innerHTML = `<div class="row"><button class="panel-btn go" id="cdAgree">Agree: throw both out</button><button class="panel-btn" id="cdRefuse">Refuse</button></div>`;
    $('#cdAgree').onclick = () => send({ type: 'vetoAnswer', agree: true });
    $('#cdRefuse').onclick = () => send({ type: 'vetoAnswer', agree: false });
  } else if (v.phase === 'power' && v.regent === you) {
    if (v.power === 'peek') {
      p.innerHTML = `<p class="cd-hint">The next three edicts, top first:</p><div class="cd-hand">${v.peek.map(c => edict(c)).join('')}</div><button class="panel-btn go wide" id="cdDone">Done</button>`;
      $('#cdDone').onclick = () => send({ type: 'power' });
    } else {
      const r = pickList(v.targets, POWER_TEXT[v.power], s => send({ type: 'power', s }));
      p.innerHTML = r.html; wire = r.onPick;
    }
  } else if (v.phase === 'seen' && v.seen) {
    p.innerHTML = `<div class="cd-seen ${v.seen.side}">${v.seen.side === 'loyal' ? CROWN : DAGGER}<p><b>${esc(ctx.nameOf(v.seen.seat))}</b> is ${v.seen.side === 'loyal' ? 'a <b>Loyalist</b>' : 'with the <b>Conspiracy</b>'}.</p></div>
      <button class="panel-btn go wide" id="cdDone">Done</button><p class="cd-hint">Only you saw this. You may tell the table the truth, or lie.</p>`;
    $('#cdDone').onclick = () => send({ type: 'done' });
  } else {
    const known = Object.entries(v.known);
    p.innerHTML = `<ul class="cd-log">${v.log.slice(-3).map(l => `<li>${fmt(l, ctx.nameOf)}</li>`).join('')}</ul>
      ${known.length ? `<p class="cd-hint">You learned: ${known.map(([s, side]) => `${esc(ctx.nameOf(Number(s)))} is ${side === 'loyal' ? 'Loyal' : 'Conspiracy'}`).join(' · ')}</p>` : ''}`;
  }
  if (wire) p.querySelectorAll('[data-s]').forEach(b => { b.onclick = () => wire(Number(b.dataset.s)); });
}

export function render(c) {
  ctx = c;
  const v = c.st.game;
  const you = c.st.you;
  const N = s => c.nameOf(s);
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${N(you)}${v.alive[you] === false ? ' · banished' : ''}`;
  setHud('#hudL', 'Loyal', `${v.loyal}/5`, '');
  $('#hudC').innerHTML = `<span>Failed</span><b>${v.tracker}/3</b>`;
  setHud('#hudR', 'Dagger', `${v.dagger}/6`, '');

  const mine = (v.phase === 'nominate' && v.regent === you) || (v.phase === 'vote' && v.alive[you] && v.myVote === null)
    || (v.hand && ((v.phase === 'regentLegis' && v.regent === you) || (v.phase === 'stewardLegis' && v.steward === you)))
    || (['power', 'veto', 'seen'].includes(v.phase) && v.regent === you);
  document.body.classList.toggle('myturn', !!mine);

  if (v.phase === 'over') setStatus(v.winner.team === 'loyal' ? 'The Loyalists win!' : 'The Conspiracy wins!', v.winner.why);
  else if (v.phase === 'nominate') setStatus(v.regent === you ? 'You are the Regent' : `${N(v.regent)} is Regent`, v.regent === you ? 'Choose a Steward' : 'Waiting for the Regent to choose a Steward');
  else if (v.phase === 'vote') setStatus(`Regent ${N(v.regent)} + Steward ${N(v.nominee)}?`, v.alive[you] ? (v.myVote === null ? 'Vote Aye or Nay' : `You voted ${v.myVote ? 'Aye' : 'Nay'}`) : 'Banished players watch');
  else if (v.phase === 'voteResult') setStatus(v.lastVote.passed ? `Approved ${v.lastVote.ayes}–${v.lastVote.nays}` : `Refused ${v.lastVote.nays}–${v.lastVote.ayes}`, 'Look at the table');
  else if (v.phase === 'regentLegis') setStatus(v.regent === you ? 'Discard one edict' : `${N(v.regent)} is choosing`, v.regent === you ? 'In secret' : 'The Regent discards one of three edicts');
  else if (v.phase === 'stewardLegis') setStatus(v.steward === you ? 'Enact one edict' : `${N(v.steward)} is choosing`, v.steward === you ? 'The other is discarded in secret' : 'The Steward enacts one of two edicts');
  else if (v.phase === 'veto') setStatus('Veto requested', v.regent === you ? 'Do you agree?' : `${N(v.regent)} decides`);
  else if (v.phase === 'power') setStatus(v.regent === you ? 'Use your power' : `${N(v.regent)} has a power`, POWER_TEXT[v.power]);
  else if (v.phase === 'seen') setStatus(v.regent === you ? 'What you learned' : `${N(v.regent)} is looking`, '');
  else setStatus(v.lastEnacted ? `${v.lastEnacted.card === 'L' ? 'Loyal' : 'Dagger'} edict enacted` : 'The council failed', '');

  roleCard(v);
  renderPanel(v);
  renderHand([]);
}
