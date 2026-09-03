#!/usr/bin/env node
/* =====================================================================
 * VentureSetu — one-time CONTENT importer (editorial + platform config)
 * ---------------------------------------------------------------------
 * Writes scripts/content-seed.json (events/tracks/schemes/news/faqs/
 * market/channels) into Firestore with stable document ids.
 *
 * It NEVER writes users, startups, investors, connections, threads,
 * messages, audits or flags — those are created only by real app use.
 *
 * Usage (from project root):
 *   npm run seed:content -- --project <project-id> --key <service-account.json>
 * or with GOOGLE_APPLICATION_CREDENTIALS set:
 *   GOOGLE_APPLICATION_CREDENTIALS=./vs-service-account.json npm run seed:content -- --project <project-id>
 *
 * Re-running is safe (idempotent upserts, no deletions).
 * ===================================================================== */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const projectId = arg('project') ?? process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
const keyPath = arg('key') ?? process.env.GOOGLE_APPLICATION_CREDENTIALS ?? null;
if (!projectId) {
  console.error('Missing project id — pass --project <project-id> (or set FIREBASE_PROJECT_ID).');
  process.exit(1);
}

const { cert, initializeApp, getApps } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');

if (!getApps().length) {
  initializeApp({ projectId, ...(keyPath ? { credential: cert(keyPath) } : {}) });
}
const db = getFirestore();

const seed = JSON.parse(readFileSync(join(ROOT, 'scripts', 'content-seed.json'), 'utf8'));

/** Docs land in ONE /content collection, partitioned by `section`. Event */
/** RSVP counters start at 0. FAQ docs have no natural id — index-stable. */
async function upsert(kind, docs) {
  const batch = db.batch();
  let n = 0;
  docs.forEach((d, i) => {
    const id = d.id ?? (kind === 'faqs' ? `fq-${i + 1}` : null);
    if (!id) throw new Error(`[${kind}] doc missing stable "id": ${JSON.stringify(d).slice(0, 120)}`);
    const { id: _drop, ...rest } = d;
    const data = { ...rest, section: kind };
    if (kind === 'events') data.rsvpCount = 0; // live counter — real RSVPs only
    batch.set(db.collection('content').doc(id), data, { merge: true });
    n += 1;
  });
  await batch.commit();
  return n;
}

async function main() {
  const kinds = ['events', 'tracks', 'schemes', 'news', 'faqs', 'market'];
  let total = 0;
  for (const k of kinds) {
    if (!Array.isArray(seed[k]) || !seed[k].length) continue;
    const n = await upsert(k, seed[k]);
    total += n;
    console.log(`  content/[${k}] -> ${n} docs (section="${k}")`);
  }

  const cb = db.batch();
  let chan = 0;
  for (const c of seed.channels ?? []) {
    if (!c.id || !c.role || !c.kind) throw new Error(`channel missing id/role/kind: ${JSON.stringify(c)}`);
    const { id, role, kind, name, desc, order } = c;
    cb.set(db.collection('channels').doc(id), { role, kind, name, desc: desc ?? '', order: order ?? 0 }, { merge: true });
    chan += 1;
  }
  await cb.commit();
  console.log(`  channels -> ${chan} docs`);

  console.log(`\nDone — imported ${total} content docs + ${chan} channel config docs into project "${projectId}".`);
  console.log('Nothing user-generated was written; the database stays empty of demo people/startups.');
}

main().catch(e => { console.error('Import failed:', e.message); process.exit(1); });
