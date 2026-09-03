/* One-time tool: extracts the editorial content arrays from the legacy
 * src/lib/data.ts (before it is deleted) and writes scripts/content-seed.json,
 * which the optional `npm run seed:content` importer pushes to Firestore.
 * This file is a build-time authoring tool only — nothing in the app reads it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const src = readFileSync(join(root, 'src', 'lib', 'data.ts'), 'utf8');

function sliceConst(name) {
  const marker = `export const ${name}`;
  const start = src.indexOf(marker);
  if (start < 0) throw new Error(`const ${name} not found`);
  const arrOpen = src.indexOf('[', start);
  const arrEnd = src.indexOf('\n];', arrOpen);
  if (arrEnd < 0) throw new Error(`array ${name} not closed`);
  const body = src.slice(arrOpen, arrEnd + 2);
  const MIN = 60_000, HOUR = 3_600_000, DAY = 86_400_000, now = Date.now();
  // eslint-disable-next-line no-eval
  return Function('MIN', 'HOUR', 'DAY', 'now', 'Date', `return ${body}`)(MIN, HOUR, DAY, now, Date);
}

/* Content docs land at content/<kind>/<docId> — the path is the discriminator,
 * so event-category, track-level etc. keep their natural field names. */
const events = sliceConst('seedEvents').map(e => ({
  id: e.id, title: e.title, kind: e.kind, date: e.date, time: e.time, where: e.where,
  host: e.host, seats: e.seats, rsvpCount: Math.max(0, e.seats - e.left),
  desc: e.desc, tags: e.tags, featured: !!e.featured,
}));

const tracks = sliceConst('seedTracks').map(t => ({
  id: t.id, title: t.title, level: t.level, mins: t.mins, lessons: t.lessons,
  desc: t.desc, author: t.author, hue: t.hue, tags: t.tags,
}));

const schemes = sliceConst('seedSchemes').map(s => ({
  id: s.id, name: s.name, by: s.by, benefit: s.benefit, elig: s.elig,
  sector: s.sector, stage: s.stage, deadline: s.deadline, hue: s.hue,
}));

const news = sliceConst('seedNews').map(n => ({
  id: n.id, title: n.title, src: n.src, ts: n.ts, tag: n.tag, desc: n.desc,
  mins: n.mins, featured: !!n.featured,
}));

const faqs = sliceConst('seedFaqs').map(f => ({ id: f.id, q: f.q, a: f.a, cat: f.cat }));

const market = sliceConst('seedMarket').map(m => ({
  id: m.id, title: m.title, org: m.org, kind: m.kind, desc: m.desc, points: m.points,
  hue: m.hue, tags: m.tags,
}));

/* Role communities: channel meta ONLY — no fake members or conversations.
 * The live community starts quiet; members fill it with real messages. */
const channels = [];
const fChannels = sliceConst('founderChannels');
const iChannels = sliceConst('investorChannels');
for (const c of fChannels) channels.push({ id: c.id, role: 'founder', ckind: c.kind, name: c.name, desc: c.desc ?? '', order: channels.length });
for (const c of iChannels) channels.push({ id: c.id, role: 'investor', ckind: c.kind, name: c.name, desc: c.desc ?? '', order: channels.length });

const out = {
  _comment: 'Editorial content for VentureSetu Firestore. Import with `npm run seed:content -- --project <id>` (see docs/FIREBASE.md). App code never reads this file.',
  events, tracks, schemes, news, faqs, market,
  channels,
};
const count = events.length + tracks.length + schemes.length + news.length + faqs.length + market.length;
writeFileSync(join(here, 'content-seed.json'), JSON.stringify(out, null, 2));
console.log(`Wrote scripts/content-seed.json (${count} content docs, ${channels.length} channels).`);
