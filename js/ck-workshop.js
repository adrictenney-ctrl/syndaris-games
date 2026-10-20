// Chef's Kiss Card Workshop: where players write their own cards on their phone (customizable
// cards spec, section 4). Four screens in one full-screen panel:
//   1 home     level badge, New Signature Recipe, New Snack Card, My Cards
//   2 editor   live card preview, the fields, "Add salt and pepper" and "Save card"
//   3 options  "Yours" plus Option 1–3, each with "Use this" / "Tweak it"; "Keep mine", "Shake again"
//   4 saved    "Saved to My Cards", "Play it at this table", "Share with Cards from the Community"
// Cards are kept on this phone (private by default). A draft is saved as you type, so it survives
// the phone locking. Nothing is saved until the player chooses.
import { LIMITS, ANSWER_TYPES, cardProblem, makeCustomCard, FAMILY_MSG } from './ck-custom.js?v=1';

const LS = { cards: 'pod.ck.cards', draft: 'pod.ck.draft', owner: 'pod.ck.owner' };
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const LEVEL_NAME = { mild: 'Mild', medium: 'Medium', hot: 'Hot' };
const SHAKER = '<svg class="ckw-shaker" viewBox="0 0 32 32" aria-hidden="true"><path d="M9 4h5v4H9zM7 8h9l1.5 4v15a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 27V12z" fill="#fbf7ef" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="10" cy="5.6" r=".7" fill="currentColor"/><circle cx="12.6" cy="5.6" r=".7" fill="currentColor"/><path d="M19 9h5v4h-5zM18 13h7l1.5 4v10a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 16.5 27V17z" fill="#3a332e" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="21.5" cy="11" r=".7" fill="#f4efe6"/></svg>';

export const ownerId = () => {
  let id = read(LS.owner, null);
  if (!id) { id = 'p_' + (crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)); write(LS.owner, id); }
  return id;
};
export const myCards = () => read(LS.cards, []).filter(c => c && c.id && c.type);
const saveCards = list => write(LS.cards, list);

// opts: { level, send(action), toast(text), activeIds(), ideas() -> Promise<string[]>, startOn? }
export function openWorkshop(opts) {
  let el = document.getElementById('ckWork');
  if (!el) { el = document.createElement('div'); el.id = 'ckWork'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Card Workshop'); document.body.appendChild(el); }
  const level = opts.level || 'mild';
  // The screen state. A draft in progress comes back after the phone locks or the page reloads.
  let screen = 'home', draft = read(LS.draft, null), options = null, optState = 'idle', saved = null, errors = {}, ideaList = null, optIdx = 0, shareMsg = '';
  if (draft && draft.level === level) screen = 'edit'; else draft = null;
  if (opts.startOn === 'snack' && !draft) newDraft('snack');

  function newDraft(type, from = {}) {
    draft = { type, level, text: from.text || '', flavor: from.flavor || '', answerTypes: from.answerTypes || [], editingId: from.editingId || null, seasoned: !!from.seasoned };
    write(LS.draft, draft); errors = {}; screen = 'edit';
  }
  const close = () => { el.remove(); };
  const keepDraft = () => write(LS.draft, draft);
  const dropDraft = () => { draft = null; write(LS.draft, null); };

  // ---------------------------------------------------------------- screen 1: home
  function home() {
    const cards = myCards().filter(c => c.level === level);
    const active = new Set(opts.activeIds?.() || []);
    return `<header class="ckw-top"><h2>Card Workshop</h2><span class="ckw-level" aria-label="Table level: ${LEVEL_NAME[level]}">${LEVEL_NAME[level]}</span><button type="button" class="ckw-x" data-a="close" aria-label="Close Card Workshop">✕</button></header>
      <div class="ckw-body">
        <button type="button" class="ckw-new" data-a="new-recipe"><b>New Signature Recipe</b><small>Write your own prompt card</small></button>
        <button type="button" class="ckw-new snack" data-a="new-snack"><b>New Snack Card</b><small>Bring your own answer card</small></button>
        <h3 class="ckw-h">My Cards</h3>
        ${cards.length ? `<ul class="ckw-list">${cards.map(c => `<li>
          <button type="button" class="ckw-row" data-edit="${esc(c.id)}"><span class="ckw-tag ${c.type === 'snack' ? 'snack' : ''}">${c.type === 'snack' ? 'Snack' : 'Recipe'}</span><span class="ckw-text">${esc(c.text)}</span>${active.has(c.id) ? '<small class="ckw-on">At this table</small>' : ''}</button>
          <button type="button" class="ckw-del" data-del="${esc(c.id)}" aria-label="Delete ${esc(c.text)}">✕</button></li>`).join('')}</ul>`
        : '<p class="ckw-empty">No cards yet. Make your first one!</p>'}
      </div>`;
  }

  // ---------------------------------------------------------------- screen 2: editor
  const preview = d => d.type === 'snack'
    ? `<div class="ckw-card ing"><span class="ckw-kind">Snack card</span><p>${esc(d.text) || '<i>A kitten who judges your life choices</i>'}</p>${d.flavor ? `<small>${esc(d.flavor)}</small>` : ''}</div>`
    : `<div class="ckw-card rec"><span class="ckw-kind">Signature Recipe</span><p>${esc(d.text) || '<i>The worst thing to find in your lunchbox</i>'}</p></div>`;
  const counter = (n, max) => `<span class="ckw-count${n > max ? ' over' : ''}" aria-live="polite">${n}/${max}</span>`;
  function editor() {
    const d = draft, rec = d.type === 'signature_recipe';
    const ok = !cardProblem(d);
    return `<header class="ckw-top"><button type="button" class="ckw-back" data-a="home" aria-label="Back to Card Workshop">‹</button><h2>${rec ? 'Signature Recipe' : 'Snack Card'}</h2><span class="ckw-level">${LEVEL_NAME[level]}</span></header>
      <div class="ckw-body">
        <div class="ckw-preview" aria-hidden="true">${preview(d)}</div>
        ${rec ? `
          <label class="ckw-field"><span class="ckw-label">Your prompt ${counter(d.text.length, LIMITS.signature_recipe)}</span>
            <input name="text" maxlength="${LIMITS.signature_recipe + 20}" value="${esc(d.text)}" placeholder="The worst thing to find in your lunchbox" autocomplete="off" enterkeyhint="next" aria-describedby="hText">
            <small id="hText" class="ckw-hint">Ask a question or leave a blank.</small>${errors.text ? `<small class="ckw-err" role="alert">${esc(errors.text)}</small>` : ''}</label>
          <fieldset class="ckw-field"><legend class="ckw-label">What kind of answer fits?</legend>
            <div class="ckw-chips">${ANSWER_TYPES.map(([k, t]) => `<button type="button" class="ckw-chip" data-chip="${k}" aria-pressed="${d.answerTypes.includes(k)}">${t}</button>`).join('')}</div>
            <small class="ckw-hint">Helps the game deal cards that fit.</small>${errors.types ? `<small class="ckw-err" role="alert">${esc(errors.types)}</small>` : ''}</fieldset>`
        : `
          <label class="ckw-field"><span class="ckw-label">Your answer ${counter(d.text.length, LIMITS.snack)}</span>
            <input name="text" maxlength="${LIMITS.snack + 20}" value="${esc(d.text)}" placeholder="A kitten who judges your life choices" autocomplete="off" enterkeyhint="next" aria-describedby="hText">
            <small id="hText" class="ckw-hint">A thing, person or short phrase.</small>${errors.text ? `<small class="ckw-err" role="alert">${esc(errors.text)}</small>` : ''}</label>
          <label class="ckw-field"><span class="ckw-label">Flavor line (optional) ${counter(d.flavor.length, LIMITS.flavor)}</span>
            <input name="flavor" maxlength="${LIMITS.flavor + 20}" value="${esc(d.flavor)}" placeholder="She's not mad. Just disappointed." autocomplete="off" enterkeyhint="done" aria-describedby="hFlavor">
            <small id="hFlavor" class="ckw-hint">A tiny joke under the answer. Skip it if you want.</small>${errors.flavor ? `<small class="ckw-err" role="alert">${esc(errors.flavor)}</small>` : ''}</label>
          ${opts.ideas ? `<div class="ckw-ideas"><button type="button" class="ckw-link" data-a="ideas">Need an idea?</button>${Array.isArray(ideaList) ? ideaList.map((t, i) => `<button type="button" class="ckw-idea" data-idea="${i}">${esc(t)}</button>`).join('') : ideaList === 'loading' ? '<small class="ckw-hint">Thinking…</small>' : ''}</div>` : ''}`}
        ${errors.save ? `<p class="ckw-err" role="alert">${esc(errors.save)}</p>` : ''}
      </div>
      <footer class="ckw-actions">
        <button type="button" class="ckw-btn season" data-a="season" ${ok ? '' : 'disabled'}>${SHAKER}Add salt and pepper</button>
        <button type="button" class="ckw-btn go" data-a="save">Save card</button>
      </footer>`;
  }

  // ---------------------------------------------------------------- screen 3: seasoned versions
  function optionsScreen() {
    if (optState === 'loading') return `<header class="ckw-top"><h2>Salt and pepper</h2></header>
      <div class="ckw-body ckw-center" aria-live="polite"><div class="ckw-shake">${SHAKER}</div><p class="ckw-wait">Adding salt and pepper…</p></div>`;
    if (optState === 'error') return `<header class="ckw-top"><button type="button" class="ckw-back" data-a="edit" aria-label="Back to the card">‹</button><h2>Salt and pepper</h2></header>
      <div class="ckw-body ckw-center"><p class="ckw-wait" role="alert">Couldn't add salt and pepper right now.</p></div>
      <footer class="ckw-actions"><button type="button" class="ckw-btn" data-a="keep">Keep mine</button><button type="button" class="ckw-btn go" data-a="shake">Try again</button></footer>`;
    const mine = { ...draft };
    return `<header class="ckw-top"><button type="button" class="ckw-back" data-a="edit" aria-label="Back to the card">‹</button><h2>Salt and pepper</h2></header>
      <div class="ckw-body">
        <p class="ckw-label">Yours</p>${preview(mine)}
        <div class="ckw-opt-nav"><button type="button" class="ckw-link" data-a="prev" ${optIdx ? '' : 'disabled'} aria-label="Previous option">‹ Previous</button><span aria-live="polite">Option ${optIdx + 1} of ${options.length}</span><button type="button" class="ckw-link" data-a="next" ${optIdx < options.length - 1 ? '' : 'disabled'} aria-label="Next option">Next ›</button></div>
        <div class="ckw-opts" role="list">${options.map((o, i) => `<section class="ckw-opt" role="listitem" aria-label="Option ${i + 1}" data-opt="${i}">
          <p class="ckw-label">Option ${i + 1}</p>${preview({ ...draft, text: o.text, flavor: o.flavor || '' })}
          <div class="ckw-row2"><button type="button" class="ckw-btn" data-tweak="${i}">Tweak it</button><button type="button" class="ckw-btn go" data-use="${i}">Use this</button></div></section>`).join('')}</div>
      </div>
      <footer class="ckw-actions"><button type="button" class="ckw-btn" data-a="keep">Keep mine</button><button type="button" class="ckw-btn" data-a="shake">${SHAKER}Shake again</button></footer>`;
  }

  // ---------------------------------------------------------------- screen 4: saved
  function savedScreen() {
    const c = saved;
    const active = new Set(opts.activeIds?.() || []);
    return `<header class="ckw-top"><h2>Saved to My Cards</h2><button type="button" class="ckw-x" data-a="close" aria-label="Close Card Workshop">✕</button></header>
      <div class="ckw-body">
        ${preview({ type: c.type, text: c.text, flavor: c.flavor || '' })}
        <p class="ckw-hint">Your cards are private unless you share them.</p>
        ${shareMsg ? `<p class="ckw-note" role="status">${esc(shareMsg)}</p>` : ''}
      </div>
      <footer class="ckw-actions col">
        <button type="button" class="ckw-btn go" data-a="play" ${active.has(c.id) ? 'disabled' : ''}>${active.has(c.id) ? 'At this table' : 'Play it at this table'}</button>
        <button type="button" class="ckw-btn" data-a="share" ${c.status === 'private' || c.status === 'rejected' ? '' : 'disabled'}>Share with Cards from the Community</button>
        <button type="button" class="ckw-link" data-a="home">Back to Card Workshop</button>
      </footer>`;
  }

  // ---------------------------------------------------------------- actions
  async function check(card) {
    // The server's family-friendly check; if it can't be reached, the word list (already run) decides.
    try {
      const res = await fetch('/api/check-card', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(card) });
      if (res.ok) { const r = await res.json(); return r.ok ? null : r.message || FAMILY_MSG; }
    } catch {}
    return null;
  }
  async function save(fields, seasoned) {
    errors = {};
    let card;
    try {
      const prev = myCards().find(c => c.id === draft.editingId);
      card = makeCustomCard({ ...fields, level, ownerId: ownerId(), seasoned, id: prev?.id, createdAt: prev?.createdAt });
    } catch (e) { errors.save = e.message; screen = 'edit'; return draw(); }
    const btn = el.querySelector('[data-a="save"], [data-use], [data-a="keep"]');
    if (btn) btn.disabled = true;
    const problem = await check(card);
    if (problem) { errors.save = problem; screen = 'edit'; return draw(); }
    const list = myCards().filter(c => c.id !== card.id);
    list.unshift(card);
    saveCards(list);
    saved = card; shareMsg = ''; dropDraft(); screen = 'saved'; draw();
  }
  async function season() {
    screen = 'options'; optState = 'loading'; options = null; optIdx = 0; draw();
    const body = { type: draft.type, level, text: draft.text, flavor: draft.type === 'snack' ? draft.flavor || null : null, answerTypes: draft.answerTypes, playerId: ownerId() };
    try {
      const res = await Promise.race([
        fetch('/api/season-card', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
        new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 20000)),
      ]);
      const data = res.ok ? await res.json() : null;
      if (!Array.isArray(data?.options) || data.options.length !== 3) throw new Error('bad');
      options = data.options.map(o => ({ text: String(o.text || ''), flavor: o.flavor || '' })); optState = 'ready';
    } catch { optState = 'error'; }
    if (screen === 'options') draw();
  }
  async function share() {
    const c = saved;
    shareMsg = '';
    try {
      const [{ db }, fs] = await Promise.all([import('./firebase.js?v=3'), import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')]);
      await fs.setDoc(fs.doc(db, 'cardReviews', c.id), { cardId: c.id, type: c.type, level: c.level, text: c.text, flavor: c.flavor, answerTypes: c.answerTypes, ownerId: c.ownerId, status: 'pending_review', createdAt: fs.serverTimestamp() });
      const list = myCards().map(x => (x.id === c.id ? { ...x, status: 'pending_review', updatedAt: new Date().toISOString() } : x));
      saveCards(list); saved = list.find(x => x.id === c.id);
      shareMsg = "Sent for review. It stays private until it's approved.";
    } catch { shareMsg = 'Couldn’t send it right now. Check your connection and try again.'; }
    draw();
  }

  function wire() {
    const on = (sel, fn) => el.querySelectorAll(sel).forEach(b => b.addEventListener('click', fn));
    on('[data-a="close"]', close);
    on('[data-a="home"]', () => { screen = 'home'; draw(); });
    on('[data-a="new-recipe"]', () => { newDraft('signature_recipe'); draw(); el.querySelector('input[name="text"]')?.focus(); });
    on('[data-a="new-snack"]', () => { newDraft('snack'); draw(); el.querySelector('input[name="text"]')?.focus(); });
    el.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
      const c = myCards().find(x => x.id === b.dataset.edit);
      if (c) { newDraft(c.type, { text: c.text, flavor: c.flavor || '', answerTypes: c.answerTypes || [], editingId: c.id, seasoned: c.seasoned }); draw(); }
    }));
    el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      const c = myCards().find(x => x.id === b.dataset.del);
      if (!c || !confirm(`Are you sure? “${c.text}” will be deleted.`)) return;
      saveCards(myCards().filter(x => x.id !== c.id));
      if ((opts.activeIds?.() || []).includes(c.id)) opts.send({ type: 'uncustom', id: c.id });
      draw();
    }));
    // Editor: typing updates the preview, the counters and the draft, without redrawing the inputs
    // (so the keyboard stays open).
    el.querySelectorAll('.ckw-field input').forEach(inp => inp.addEventListener('input', () => {
      draft[inp.name] = inp.value; keepDraft();
      el.querySelector('.ckw-preview').innerHTML = preview(draft);
      const max = inp.name === 'flavor' ? LIMITS.flavor : LIMITS[draft.type];
      const cnt = inp.closest('.ckw-field').querySelector('.ckw-count');
      cnt.textContent = `${inp.value.length}/${max}`; cnt.classList.toggle('over', inp.value.length > max);
      el.querySelector('[data-a="season"]').disabled = !!cardProblem(draft);
    }));
    el.querySelectorAll('[data-chip]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.chip, set = new Set(draft.answerTypes);
      set.has(k) ? set.delete(k) : set.add(k);
      draft.answerTypes = ANSWER_TYPES.map(([x]) => x).filter(x => set.has(x)); keepDraft();
      b.setAttribute('aria-pressed', set.has(k));
      el.querySelector('[data-a="season"]').disabled = !!cardProblem(draft);
    }));
    on('[data-a="ideas"]', async () => {
      ideaList = 'loading'; draw();
      try { ideaList = (await opts.ideas()).slice(0, 3); } catch { ideaList = []; }
      if (screen === 'edit') draw();
    });
    el.querySelectorAll('[data-idea]').forEach(b => b.addEventListener('click', () => { draft.text = ideaList[Number(b.dataset.idea)] || ''; keepDraft(); draw(); }));
    on('[data-a="season"]', () => {
      const p = cardProblem(draft);
      if (p) { errors = draft.type === 'signature_recipe' && /answer type/.test(p) ? { types: p } : { text: p }; return draw(); }
      season();
    });
    on('[data-a="save"]', () => {
      const p = cardProblem(draft);
      if (p) { errors = /answer type/.test(p) ? { types: p } : /flavor/.test(p) ? { flavor: p } : { text: p }; return draw(); }
      save(draft, draft.seasoned);
    });
    // Seasoned versions.
    on('[data-a="edit"]', () => { screen = 'edit'; draw(); });
    on('[data-a="keep"]', () => save(draft, draft.seasoned));
    on('[data-a="shake"]', () => season());
    el.querySelectorAll('[data-use]').forEach(b => b.addEventListener('click', () => { const o = options[Number(b.dataset.use)]; save({ ...draft, text: o.text, flavor: o.flavor || '' }, true); }));
    el.querySelectorAll('[data-tweak]').forEach(b => b.addEventListener('click', () => {
      const o = options[Number(b.dataset.tweak)];
      newDraft(draft.type, { ...draft, text: o.text, flavor: o.flavor || draft.flavor, seasoned: true }); draw();
      el.querySelector('input[name="text"]')?.focus();
    }));
    const strip = el.querySelector('.ckw-opts');
    const go = i => { optIdx = Math.max(0, Math.min(options.length - 1, i)); strip.children[optIdx]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); syncNav(); };
    const syncNav = () => {
      const nav = el.querySelector('.ckw-opt-nav'); if (!nav) return;
      nav.querySelector('span').textContent = `Option ${optIdx + 1} of ${options.length}`;
      nav.querySelector('[data-a="prev"]').disabled = optIdx === 0;
      nav.querySelector('[data-a="next"]').disabled = optIdx >= options.length - 1;
    };
    on('[data-a="prev"]', () => go(optIdx - 1));
    on('[data-a="next"]', () => go(optIdx + 1));
    strip?.addEventListener('scroll', () => { const w = strip.clientWidth || 1; const i = Math.round(strip.scrollLeft / w); if (i !== optIdx) { optIdx = i; syncNav(); } }, { passive: true });
    // Saved.
    on('[data-a="play"]', () => {
      opts.send({ type: 'custom', card: saved });
      opts.toast?.('Added to this table');
      setTimeout(draw, 400);
    });
    on('[data-a="share"]', share);
  }

  function draw() {
    el.className = 'ckw-' + screen;
    el.innerHTML = `<div class="ckw-panel">${screen === 'home' ? home() : screen === 'edit' ? editor() : screen === 'options' ? optionsScreen() : savedScreen()}</div>`;
    wire();
  }
  draw();
  return { close, redraw: () => { if (document.getElementById('ckWork') && screen !== 'edit') draw(); } };
}
