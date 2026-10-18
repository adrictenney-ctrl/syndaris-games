// Builds the Chef's Kiss master card database (js/chefskiss-db.js) from content/chefskiss/*.txt.
// Usage:  node tools/build-chefskiss-cards.mjs           (fails if a level is short of cards)
//         node tools/build-chefskiss-cards.mjs --check   (checks only, writes nothing)
// See content/chefskiss/README.md for the line formats and the ID rules.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'content/chefskiss');
const OUT = path.join(ROOT, 'js/chefskiss-db.js');
const LEVELS = ['mild', 'medium', 'spicy'];
const MIN = { recipe: 200, ingredient: 800 };    // SPEC.md Section 15 (approved 18 Oct 2026): per level
const DIMS = ['subject', 'tone', 'scale', 'register', 'violation', 'status'];
const TAX = JSON.parse(fs.readFileSync(path.join(SRC, 'taxonomy.json'), 'utf8'));
const checkOnly = process.argv.includes('--check');

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

// A tag group is 4 or 6 fields: subject tone scale register [violation status].
function group(str, where, { full = false } = {}) {
  const parts = String(str || '').trim().split(/\s+/);
  if (parts.length !== 4 && parts.length !== 6) { fail(where, `tag group "${str}" needs 4 or 6 fields (subject tone scale register [violation status])`); return null; }
  const out = {};
  DIMS.forEach((dim, i) => {
    const f = parts[i] ?? '-';
    out[dim] = f === '-' ? [] : [...f].map(ch => {
      const tag = TAX.codes[dim][ch];
      if (!tag) fail(where, `unknown ${dim} code "${ch}"`);
      return tag;
    }).filter(Boolean);
    if (new Set(out[dim]).size !== out[dim].length) fail(where, `repeated ${dim} code in "${f}"`);
    if (full && i < 4 && !out[dim].length) fail(where, `every card needs a ${dim} tag`);
  });
  return out;
}
const empty = g => !g || DIMS.every(d => !g[d].length);
// A combo keeps only the axes it names (SPEC.md Section 5.2: "a partial tags object").
const partial = g => Object.fromEntries(DIMS.filter(d => g[d].length).map(d => [d, g[d]]));
const union = list => Object.fromEntries(DIMS.map(d => [d, [...new Set(list.flatMap(g => g[d] || []))]]));

function meta(str, where) {
  const m = { knownness: 4, born: null, peak: null, stale: null };
  for (const tok of String(str || '').trim().split(/\s+/).filter(Boolean)) {
    const v = tok.slice(1);
    if (tok[0] === 'k' && /^[1-5]$/.test(v)) m.knownness = Number(v);
    else if ('@^~'.includes(tok[0]) && /^\d{4}$/.test(v)) m[{ '@': 'born', '^': 'peak', '~': 'stale' }[tok[0]]] = v;
    else fail(where, `bad meta token "${tok}"`);
  }
  return m;
}

const norm = t => t.toLowerCase().replace(/^(a|an|the)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();

// ---------------------------------------------------------------- read the sources
const cards = [];
for (const level of LEVELS) {
  for (const type of ['recipe', 'ingredient']) {
    const file = `${level}-${type}s.txt`;
    const full = path.join(SRC, file);
    if (!fs.existsSync(full)) { fail(file, 'missing'); continue; }
    fs.readFileSync(full, 'utf8').split(/\r?\n/).forEach((line, i) => {
      if (!line.trim() || line.trim().startsWith('#')) return;
      const where = `${file}:${i + 1}`;
      const f = line.split('|').map(s => s.trim());
      const text = f[0];
      if (!text || text.length > 120) fail(where, 'text must be 1–120 characters');
      if (/[<>]/.test(text)) fail(where, 'no < or > in card text');
      const tags = group(f[1], where, { full: true });
      const c = { type, level, text, tags, where };
      if (type === 'recipe') {
        // funnyTargetCombos: one or more tag groups separated by ";" (each one technique).
        const combos = String(f[2] || '').split(';').map(x => group(x, where)).filter(g => g && !empty(g));
        c.funnyTargetCombos = combos.map(partial);
        c.funnyTargets = union(c.funnyTargetCombos);
        c.literalTags = group(f[3], where);
        if (!combos.length) fail(where, 'a Recipe Card needs funnyTargetCombos');
        if (empty(c.literalTags)) fail(where, 'a Recipe Card needs literalTags');
        c.meta = meta(f[4], where); c.hint = f[5] || '';
        if (f.length > 6) fail(where, 'too many | fields');
      } else {
        c.meta = meta(f[2], where); c.hint = f[3] || '';
        if (f.length > 4) fail(where, 'too many | fields');
      }
      if (type === 'ingredient' && tags?.subject.includes('pop_culture') && !c.meta.born) fail(where, 'pop-culture cards need @year (culture.born)');
      cards.push(c);
    });
  }
}

// One card per text, across every level and type.
const seen = new Map();
for (const c of cards) {
  const k = norm(c.text);
  if (seen.has(k)) fail(c.where, `duplicate of ${seen.get(k).where} ("${seen.get(k).text}")`);
  else seen.set(k, c);
}

// ---------------------------------------------------------------- counts
const counts = {};
for (const c of cards) counts[`${c.level} ${c.type}`] = (counts[`${c.level} ${c.type}`] || 0) + 1;
for (const level of LEVELS) for (const type of ['recipe', 'ingredient']) {
  const n = counts[`${level} ${type}`] || 0;
  console.log(`${level.padEnd(6)} ${type.padEnd(10)} ${String(n).padStart(4)}  (need ${MIN[type]})`);
  if (n < MIN[type]) console.log(`       SHORT: the spec asks for ${MIN[type]} (Al's 18 Oct decks will fill this)`);
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.slice(0, 80).join('\n'));
  process.exit(1);
}
if (checkOnly) { console.log('\nAll cards OK (check only).'); process.exit(0); }

// ---------------------------------------------------------------- permanent IDs
let old = [];
if (fs.existsSync(OUT)) old = (await import(pathToFileURL(OUT).href + '?t=' + Date.now())).CARDS || [];
const byKey = new Map(old.map(r => [`${r.type}|${r.text}`, r]));
const next = { recipe: 0, ingredient: 0 };
for (const r of old) { const n = Number(r.id.slice(3)); if (n > next[r.type]) next[r.type] = n; }
const stamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const prefix = { recipe: 'rc_', ingredient: 'ic_' };

const records = [];
const used = new Set();
for (const c of cards) {
  const prev = byKey.get(`${c.type}|${c.text}`);
  const decade = c.meta.born ? `${Math.floor(Number(c.meta.born) / 10) * 10}s` : undefined;
  const r = {
    id: prev ? prev.id : prefix[c.type] + String(++next[c.type]).padStart(6, '0'),
    type: c.type,
    text: c.text,
    source: 'official',
    level: c.level,
    status: 'active',
    audience: { readingLevel: c.level, cultureLevel: c.level, knownness: c.meta.knownness },
    culture: { born: c.meta.born, peak: c.meta.peak, stale: c.meta.stale },
    freshness: prev ? prev.freshness : 1,
    tags: c.tags,
    ...(c.type === 'recipe' ? { funnyTargetCombos: c.funnyTargetCombos, funnyTargets: c.funnyTargets, literalTags: c.literalTags } : { literalFor: prev?.literalFor || [] }),
    deckIds: ['deck_official_core'],
    ...(decade ? { decade } : {}),
    ...(c.hint ? { hint: c.hint } : {}),
    stats: prev ? prev.stats : { timesDealt: 0, timesPlayed: 0, kisses: 0 },
    createdAt: prev ? prev.createdAt : stamp,
    updatedAt: prev ? prev.updatedAt : stamp,
    version: prev ? prev.version : 1,
  };
  if (prev) {
    const strip = x => JSON.stringify({ ...x, updatedAt: 0, status: 0, retiredAt: 0 });
    if (strip(r) !== strip({ ...prev })) r.updatedAt = stamp;
  }
  used.add(r.id);
  records.push(r);
}
// Cards no longer in the sources are retired, never deleted.
let retired = 0;
for (const r of old) {
  if (used.has(r.id)) continue;
  if (r.status !== 'retired') { retired++; records.push({ ...r, status: 'retired', retiredAt: stamp, updatedAt: stamp }); }
  else records.push(r);
}
records.sort((a, b) => (a.type === b.type ? a.id.localeCompare(b.id) : a.type === 'recipe' ? -1 : 1));

const body = `// GENERATED by tools/build-chefskiss-cards.mjs from content/chefskiss/*.txt. Do not edit by hand.
// The Chef's Kiss master card database (SPEC.md Section 5.2). IDs are permanent; retired cards stay.
export const CARDS = [
${records.map(r => JSON.stringify(r)).join(',\n')}
];
`;
fs.writeFileSync(OUT, body);
console.log(`\nWrote ${records.length} cards to js/chefskiss-db.js (${retired} newly retired).`);
