// Chef's Kiss customizable cards (chefskiss_customizable_cards_spec_10-19-26.md): the two card types,
// their rules, and the family-friendly word check. Shared by the phone (Card Workshop), the table
// (dealing them) and the server endpoint (worker/), so every place checks a card the same way.
//
// There are exactly two types and no others:
//   signature_recipe  a prompt card a player writes (Recipe side only)
//   snack             an answer card a player writes (Ingredient side only)
import { FAMILY_BLOCKED_WORDS } from './ck-wordlist.js';   // no ?v=: the server bundles this file too

export const TYPES = ['signature_recipe', 'snack'];
export const LIMITS = { signature_recipe: 80, snack: 60, flavor: 60 };
export const ANSWER_TYPES = [['thing', 'Thing'], ['person', 'Person'], ['action', 'Action'], ['said', 'Something said'], ['food', 'Food']];
export const CARD_LEVELS = ['mild', 'medium', 'hot'];
export const SNACKS_PER_HAND = 2;          // at most 2 Snack cards in any hand
export const FAMILY_MSG = 'Let’s keep it family-friendly. Try different words.';

const clean = t => String(t ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
const plain = t => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`]/g, "'");
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const FAMILY_RE = new RegExp(`(^|[^a-z0-9])(${FAMILY_BLOCKED_WORDS.map(w => escRe(plain(w))).join('|')})(s|es|'s)?(?=$|[^a-z0-9])`, 'i');

// True when the text passes the word-list part of the family-friendly check.
export const familyFriendly = text => !FAMILY_RE.test(plain(text));

// The problem with a card's fields, in words a player can act on (or null when it's fine).
export function cardProblem({ type, text, flavor, answerTypes }) {
  if (!TYPES.includes(type)) return 'Pick a card type';
  const t = clean(text);
  if (!t) return type === 'signature_recipe' ? 'Write a prompt first' : 'Write an answer first';
  if (t.length > LIMITS[type]) return `Keep it to ${LIMITS[type]} characters`;
  if (type === 'signature_recipe' && !(Array.isArray(answerTypes) && answerTypes.some(a => ANSWER_TYPES.some(([k]) => k === a)))) return 'Pick at least one answer type.';
  if (type === 'snack' && flavor && clean(flavor).length > LIMITS.flavor) return `Keep the flavor line to ${LIMITS.flavor} characters`;
  if (!familyFriendly(t) || (type === 'snack' && flavor && !familyFriendly(flavor))) return FAMILY_MSG;
  return null;
}

const uuid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);

// A new custom card record (spec section 3). Throws { message } when a field isn't right.
export function makeCustomCard({ type, text, flavor = null, answerTypes = [], level, ownerId, seasoned = false, id, createdAt }) {
  const problem = cardProblem({ type, text, flavor, answerTypes });
  if (problem) throw Object.assign(new Error(problem), { code: 'invalid' });
  if (!CARD_LEVELS.includes(level)) throw Object.assign(new Error('This table has no level yet'), { code: 'level' });
  const now = new Date().toISOString();
  return {
    id: id || 'cc_' + uuid(),
    type,
    ownerId: String(ownerId || ''),
    level,
    text: clean(text),
    flavor: type === 'snack' && clean(flavor) ? clean(flavor) : null,
    answerTypes: type === 'signature_recipe' ? [...new Set(answerTypes)].filter(a => ANSWER_TYPES.some(([k]) => k === a)) : [],
    seasoned: !!seasoned,
    status: 'private',
    createdAt: createdAt || now,
    updatedAt: now,
  };
}

// Checks a card that arrives at the table from a phone: the right shape, the right level, clean words.
export function validateCustomCard(c, level) {
  if (!c || typeof c !== 'object') return 'That card couldn’t be read';
  if (typeof c.id !== 'string' || !/^cc_[\w-]{4,60}$/.test(c.id)) return 'That card couldn’t be read';
  if (c.level !== level) return `That card is for ${c.level === 'mild' ? 'Mild' : c.level === 'medium' ? 'Medium' : c.level === 'hot' ? 'Hot' : 'other'} tables`;
  return cardProblem(c);
}

// How well an Ingredient Card fits a Signature Recipe's "What kind of answer fits?" chips.
const SUBJECTS = { thing: ['thing'], person: ['person'], action: ['action', 'event'], food: ['food'] };
export function answerFit(card, answerTypes) {
  if (!card || !answerTypes?.length) return 0;
  const subj = card.tags?.subject || [];
  let fit = 0;
  for (const a of answerTypes) {
    if (a === 'said') { if (/^["“']|["”]$/.test(String(card.text || '')) || /said|quote|line/i.test(card.aaCategory || '')) fit = 1; }
    else if ((SUBJECTS[a] || []).some(s => subj.includes(s))) fit = 1;
  }
  return fit;
}
