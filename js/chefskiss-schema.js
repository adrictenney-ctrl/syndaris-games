// Checks a Chef's Kiss card against the Card schema (SPEC.md Section 5.2). Returns a list of
// problems (empty when the card is valid). Used by the tests; the game itself never throws on bad
// card data (the Laugh Engine falls back instead).
export const TAXONOMY = {
  subject: ['person', 'place', 'thing', 'event', 'nature', 'animal', 'food', 'pop_culture', 'feeling', 'action'],
  tone: ['silly', 'absurd', 'wholesome', 'awkward', 'dramatic', 'dry', 'gross_mild', 'nostalgic'],
  scale: ['tiny', 'everyday', 'huge', 'cosmic'],
  register: ['formal', 'casual', 'kid', 'slang', 'fancy', 'official_sounding'],
  violation: ['none', 'social', 'physical', 'logic'],
  status: ['high', 'low', 'neutral'],
};
export const AXES = Object.keys(TAXONOMY);
const LEVELS = ['mild', 'medium', 'spicy', 'hot', 'hellfire'];
const FAMILY = ['mild', 'medium', 'spicy'];

function checkTags(obj, label, out, { partial = false } = {}) {
  if (!obj || typeof obj !== 'object') { out.push(`${label} missing`); return; }
  for (const [axis, values] of Object.entries(obj)) {
    if (!TAXONOMY[axis]) { out.push(`${label} has unknown axis "${axis}"`); continue; }
    if (!Array.isArray(values)) { out.push(`${label}.${axis} is not a list`); continue; }
    for (const v of values) if (!TAXONOMY[axis].includes(v)) out.push(`${label}.${axis} has unknown tag "${v}"`);
  }
  if (!partial) for (const axis of ['subject', 'tone', 'scale', 'register']) if (!Array.isArray(obj[axis])) out.push(`${label}.${axis} missing`);
}

export function validateCard(c) {
  const out = [];
  if (!c || typeof c !== 'object') return ['not an object'];
  if (typeof c.id !== 'string' || !c.id) out.push('id missing');
  if (!['recipe', 'ingredient'].includes(c.type)) out.push(`type "${c.type}"`);
  if (typeof c.text !== 'string' || c.text.length < 1 || c.text.length > 120) out.push('text must be 1–120 characters');
  if (!['official', 'community', 'organic'].includes(c.source)) out.push(`source "${c.source}"`);
  if (!LEVELS.includes(c.level)) out.push(`level "${c.level}"`);
  if (['hot', 'hellfire'].includes(c.level) && c.source !== 'organic') out.push('Hot and Hellfire are for Organic Cards only');
  if (!['draft', 'in_review', 'active', 'retired', 'rejected'].includes(c.status)) out.push(`status "${c.status}"`);
  if (!c.audience || !FAMILY.includes(c.audience.readingLevel) || !FAMILY.includes(c.audience.cultureLevel)) out.push('audience levels');
  if (!(c.audience?.knownness >= 1 && c.audience?.knownness <= 5)) out.push('audience.knownness 1–5');
  if (!c.culture || ['born', 'peak', 'stale'].some(k => !(c.culture[k] === null || /^\d{4}$/.test(c.culture[k])))) out.push('culture');
  if (!(typeof c.freshness === 'number' && c.freshness >= 0 && c.freshness <= 1)) out.push('freshness 0–1');
  checkTags(c.tags, 'tags', out);
  if (c.type === 'recipe') {
    if (!Array.isArray(c.funnyTargetCombos) || !c.funnyTargetCombos.length) out.push('funnyTargetCombos missing');
    else c.funnyTargetCombos.forEach((combo, i) => checkTags(combo, `funnyTargetCombos[${i}]`, out, { partial: true }));
    checkTags(c.literalTags, 'literalTags', out, { partial: true });
  }
  if (!c.stats || ['timesDealt', 'timesPlayed', 'kisses'].some(k => !Number.isInteger(c.stats[k]))) out.push('stats');
  if (!Number.isInteger(c.version) || c.version < 1) out.push('version');
  return out;
}

// Al's test deck (cards.json) has only the fields the blind test needed. This fills in the
// Card defaults so it can run through the schema and the Laugh Engine as-is.
export function fromTestDeck(c) {
  return {
    status: 'active', source: 'official', freshness: 1,
    audience: { readingLevel: c.level, cultureLevel: c.level, knownness: 4 },
    culture: { born: null, peak: null, stale: null },
    stats: { timesDealt: 0, timesPlayed: 0, kisses: 0 }, version: 1,
    ...(c.type === 'ingredient' ? { literalFor: [] } : {}),
    ...c,
  };
}
