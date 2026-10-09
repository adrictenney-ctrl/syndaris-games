// The table side of the quiz-show kit: the question (with its picture, emoji or flash card), the
// options, the clock and who's answered; then the answer lit up, who got it and the scores.
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
export function quizTable(E, o) {
  const cfg = E.cfg;
  const rounds = o.roundsList || [[5, '5'], [10, '10'], [15, '15'], [20, '20']];
  const secs = o.secsList || [[10, '10 seconds'], [15, '15 seconds'], [20, '20 seconds'], [30, '30 seconds']];
  return partyTable(E, {
    id: o.id,
    defaults: { rounds: cfg.rounds || 10, secs: cfg.secs || 20 },
    settingsHTML: s => `<label>${cfg.elim ? 'Up to' : 'Questions'} ${opt('rounds', s, rounds)}</label><label>Time to answer ${opt('secs', s, secs)}</label>${o.note ? `<span class="yc-note">${o.note}</span>` : ''}`,
    badges: (g, s) => (cfg.elim && g.phase !== 'over' && !g.alive.includes(s) ? ['<span class="badge">out</span>'] : []),
    center(g, ctx) {
      if (g.phase === 'over') return sc(g, ctx);
      const Q = g.Q, P = cfg.elim ? g.alive : g.order, rev = g.phase === 'reveal';
      const head = `<p class="pt-kicker">${cfg.kicker ? esc(cfg.kicker(Q)) : 'Question'} · ${g.round} of ${g.settings.rounds}${cfg.elim ? ` · ${g.alive.length} still in` : ''}</p>`;
      const show = Q.show && (g.flashing || rev) ? `<div class="qz-show ${g.flashing ? 'flash' : ''}">${Q.show}</div>` : Q.show && g.phase === 'ask' ? '<div class="qz-show gone">❓</div>' : '';
      const big = Q.big ? `<div class="qz-big">${Q.bigHTML || esc(Q.big)}</div>` : '';
      const text = Q.q ? `<h2 class="pt-h qz-q">${esc(Q.q)}</h2>` : '';
      let body = '';
      if (E.mode === 'mc' || E.mode === 'order') {
        body = `<ol class="tw-choices ${Q.opts.length <= 2 ? 'two' : ''}">${Q.opts.map((t, i) => {
          const right = E.mode === 'mc' ? i === Q.a : false;
          const pos = E.mode === 'order' && rev ? Q.a.indexOf(i) + 1 : 0;
          return `<li class="tw-c${i % 4} ${rev && E.mode === 'mc' ? (right ? 'right' : 'wrong') : ''}"><span>${pos || 'ABCDEFGH'[i]}</span>${esc(String(t))}${rev && E.mode === 'mc' ? `<em>${P.filter(s => g.ans[s]?.v === i).map(s => `<i style="background:var(--seat-${s})"></i>`).join('')}</em>` : ''}</li>`;
        }).join('')}</ol>`;
      }
      if (g.phase === 'ask') {
        if (g.flashing) return `${head}${text}${show}<p class="pt-sub">Look closely…</p>`;
        return `${head}${text}${big}${show}${body}${clock()}${doneRow(g, ctx, P)}`;
      }
      const ans = E.answerText(g);
      const guesses = E.mode === 'closest' || E.mode === 'type' ? `<div class="qz-guesses">${P.filter(s => g.ans[s]).map(s => `<span class="${g.right.includes(s) ? 'ok' : ''}"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}: <b>${esc(typeof g.ans[s].v === 'number' ? g.ans[s].v.toLocaleString() : String(g.ans[s].v))}</b></span>`).join('')}</div>` : '';
      const knocked = cfg.elim && g.knocked?.length ? `<p class="pt-sub">💥 Out: ${g.knocked.map(s => esc(ctx.nameOf(s))).join(', ')}</p>` : '';
      return `${head}${text}${big}${show}${E.mode === 'mc' ? body : `<p class="qz-ans">${esc(String(ans))}</p>`}${Q.note ? `<p class="pt-sub">${esc(Q.note)}</p>` : ''}${guesses}<p class="pt-sub">${g.right.length ? `✓ ${g.right.map(s => who(ctx, s)).join(' ')}` : 'Nobody got it!'}</p>${knocked}${sc(g, ctx)}`;
    },
  });
}
