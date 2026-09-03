#!/usr/bin/env node
/* =====================================================================
 * VentureSetu — Security Rules execution suite (requirement 5 proof)
 * ---------------------------------------------------------------------
 * Boots against the LOCAL emulators only (demo project, no credentials):
 *     npm run test:rules
 * (runs `firebase emulators:exec --only firestore,storage ...`).
 *
 * It (a) compiles firestore.rules + storage.rules via the emulator,
 * (b) exercises the full access-control matrix, and (c) replays the
 * real query shapes from src/lib/store.tsx so legitimate operations
 * never 403 — including the typingBy dotted-key update and list reads
 * where every matched doc triggers get() calls (budget suspect).
 * ===================================================================== */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FS_RULES = readFileSync(join(ROOT, 'firestore.rules'), 'utf8');
const ST_RULES = readFileSync(join(ROOT, 'storage.rules'), 'utf8');

const PROJECT = 'demo-venturesetu';
const BUCKET = 'demo-venturesetu.appspot.com';

let passed = 0;
const failed = [];
function ok(name) { passed += 1; console.log(`  \u2713 ${name}`); }
function check(name, cond, extra) {
  if (cond) return ok(name);
  const msg = `${name}${extra ? ` — ${extra}` : ''}`;
  failed.push(msg);
  console.error(`  \u2717 ${msg}`);
}
const expectFail = async (name, p) => {
  try { await p; check(name, false, 'expected a permission denial but it SUCCEEDED'); }
  catch (e) {
    const code = String(e?.code ?? '');
    check(name, /permission|unauthorized|denied/i.test(code + ' ' + e?.message),
      `wrong error: code=${code} msg=${e?.message}`);
  }
};

const testEnv = await initializeTestEnvironment({
  projectId: PROJECT,
  firestore: { host: '127.0.0.1', port: 8080, rules: FS_RULES },
  storage: { host: '127.0.0.1', port: 9199, rules: ST_RULES },
});

/* ------------------------------------------------------------ fixtures */
const seed = (ctx) => ({
  users: async () => {
    const db = ctx.firestore();
    const u = (id, role, status = 'active', email = `${id}@test.dev`) =>
      db.collection('users').doc(id).set({ id, name: id, email, role, status, verified: true, mfa: false, hue: 30, createdAt: 1, onboarded: true });
    await u('founder', 'founder');
    await u('founderX', 'founder');
    await u('investor', 'investor');
    await u('investorZ', 'investor');
    await u('admin', 'admin');
    await u('susp', 'investor', 'suspended');
  },
  all: async () => {
    const db = ctx.firestore();
    await db.collection('investors').doc('investor').set({
      id: 'investor', userId: 'investor', name: 'I', firm: 'F', title: 'P', email: 'investor@test.dev',
      phone: '', location: '', hue: 1, bio: '', thesis: '', sectors: [], stages: [], geos: [],
      chequeMinL: 1, chequeMaxL: 2, qualifications: [], collaborations: [], portfolio: [], deals: 0,
      aumCr: 0, response: 1, medCloseDays: 1, verified: false, active: true,
    });
    await db.collection('investors').doc('investorZ').set({
      id: 'investorZ', userId: 'investorZ', name: 'Z', firm: 'Fz', title: 'P', email: 'z@test.dev',
      sectors: [], stages: [], geos: [], portfolio: [], verified: false, active: true,
    });
    await db.collection('startups').doc('st1').set({
      id: 'st1', ownerId: 'founder', name: 'Nexa', sector: 'SaaS', stage: 'Seed', createdAt: 1,
      deck: { name: 'd.pdf', sizeKB: 42, updatedAt: 1, path: 'decks/st1/d.pdf', sharedWith: ['investor'] },
    });
    await db.collection('startups').doc('stX').set({ id: 'stX', ownerId: 'founderX', name: 'XCorp', sector: 'AI', createdAt: 2 });
    for (let i = 1; i <= 30; i++) {
      await db.collection('startups').doc(`s${i}`).set({ id: `s${i}`, ownerId: 'founderX', name: `S${i}`, sector: 'Fin', createdAt: 100 + i });
    }
    await db.collection('connections').doc('connA').set({
      startupId: 'st1', investorId: 'investor', fromRole: 'founder', message: 'hi', status: 'accepted', createdAt: 1, stage: 'intro',
    });
    await db.collection('connections').doc('connP').set({
      startupId: 'stX', investorId: 'investor', fromRole: 'investor', message: 'hi', status: 'pending', createdAt: 2, stage: 'intro',
    });
    await db.collection('threads').doc('th1').set({
      connId: 'connA', pairIds: ['founder', 'investor'], typingBy: {},
      pair: [{ userId: 'founder' }, { userId: 'investor' }], createdAt: 1,
    });
    for (let i = 1; i <= 40; i++) {
      await db.collection('threads').doc('th1').collection('msgs').doc(`m${i}`).set({
        id: `m${i}`, senderId: i % 2 ? 'founder' : 'investor', ts: i, text: `msg ${i}`, reactions: {},
      });
    }
    await db.collection('channels').doc('cF').set({ role: 'founder', kind: 'text', name: 'gen', desc: '', order: 0 });
    await db.collection('channels').doc('cI').set({ role: 'investor', kind: 'text', name: 'gen', desc: '', order: 0 });
    await db.collection('channels').doc('cF').collection('msgs').doc('fm1').set({ authorId: 'founder', author: 'F', hue: 1, roleTag: 'Founder', ts: 1, text: 'hello', reactions: {} });
    await db.collection('content').doc('ev1').set({ title: 'Demo Day', seats: 10, rsvpCount: 2, date: 'x', section: 'events' });
    await db.collection('content').doc('fq1').set({ q: 'q', a: 'a', cat: 'c', section: 'faqs' });
    await db.collection('audits').doc('au1').set({ ts: 1, actor: 'admin@test.dev', action: 'X', target: 'y' });
    await db.collection('flags').doc('fl1').set({ content: 'c', author: 'founder', reason: 'r', ts: 1, status: 'open' });
  },
});

const auth = (uid, email, verified = true) =>
  testEnv.authenticatedContext(uid, { email, email_verified: verified });
const F = 'founder@test.dev', I = 'investor@test.dev', A = 'admin@test.dev';

/* ------------------------------------------------------------- section helpers */
function section(name) { console.log(`\n\u2500 ${name}`); }
const db = (c) => c.firestore();
const st = (c) => c.storage(`gs://${BUCKET}`);

/* ================================================================ 0. seed */
section('0. Seed fixtures (rules disabled) + storage blobs');
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  await seed(ctx).users();
  await seed(ctx).all();
  const s = st(ctx);
  await s.ref('decks/st1/d.pdf').putString('DECK-CONTENT');
  await s.ref('files/threads/th1/x/m-1.pdf').putString('FILE-CONTENT');
});
ok('fixtures written');

/* ================================================================ 1. public content */
section('1. Public content — unauthenticated reads OK, writes denied');
{
  const guest = testEnv.unauthenticatedContext();
  await assertSucceeds(db(guest).doc('content/fq1').get());
  ok('guest reads content doc (faqs section)');
  await assertSucceeds(db(guest).doc('content/ev1').get());
  ok('guest reads content doc (events section)');
  await assertSucceeds(db(guest).collection('content').where('section', '==', 'events').get());
  ok('store-shaped content query (collection where section) succeeds for guest');
  await expectFail('guest writes content (admin-only)', db(guest).collection('content').add({ title: 'x', section: 'news' }));
}

/* ================================================================ 2. users docs */
section('2. users/{uid} — owner-only reads, frozen fields, verified + suspended gating');
{
  const f = db(auth('founder', F)), x = db(auth('founderX', 'founderX@test.dev'));
  await assertSucceeds(f.doc('users/founder').get());
  ok('founder reads own user doc');
  await expectFail('founder reads another user doc', f.doc('users/investor').get());
  await expectFail('foreign reads admin doc', x.doc('users/admin').get());
  await assertSucceeds(f.doc('users/founder').update({ title: 'CEO' }));
  ok('founder updates own doc');
  await expectFail('founder self-promotes to admin', f.doc('users/founder').update({ role: 'admin' }));
  await expectFail('founder self-suspends? role frozen (status change denied)', f.doc('users/founder').update({ status: 'suspended' }));
  const unverified = auth('newbie', 'newbie@test.dev', false);
  await expectFail('unverified token cannot create users doc',
    db(unverified).collection('users').doc('newbie').set({
      id: 'newbie', name: 'N', email: 'newbie@test.dev', role: 'founder', status: 'active',
      verified: false, mfa: false, hue: 1, createdAt: 1, onboarded: false,
    }));
  const fresh = auth('fresh', 'fresh@test.dev', true);
  await assertSucceeds(db(fresh).collection('users').doc('fresh').set({
    id: 'fresh', name: 'Fr', email: 'fresh@test.dev', role: 'founder', status: 'active',
    verified: true, mfa: false, hue: 1, createdAt: 1, onboarded: false,
  }));
  ok('verified token CAN create users doc');
  await expectFail('verified token cannot create with role admin',
    db(fresh).collection('users').doc('fresh2').set({
      id: 'fresh2', name: 'x', email: 'fresh@test.dev', role: 'admin', status: 'active',
      verified: true, mfa: false, hue: 1, createdAt: 1, onboarded: false,
    }));
  const susp = db(auth('susp', 'susp@test.dev'));
  await assertSucceeds(susp.doc('users/susp').get());
  ok('suspended user reads own doc (banner path)');
  await expectFail('suspended user cannot list startups (isActive gate)',
    susp.collection('startups').limit(5).get());
  const adm = db(auth('admin', A));
  await assertSucceeds(adm.doc('users/susp').update({ status: 'active' }));
  ok('admin can reinstate a user');
}

/* ================================================================ 3. startups + investors */
section('3. startups / investors — listings read by members; owner-only writes');
{
  const f = db(auth('founder', F)), x = db(auth('founderX', 'founderX@test.dev'));
  const i = db(auth('investor', I)), adm = db(auth('admin', A));
  await assertSucceeds(f.doc('startups/st1').get());
  ok('founder reads startup (own)');
  await assertSucceeds(f.doc('startups/stX').get());
  ok('member reads ANY startup listing (marketplace)');
  await assertSucceeds(f.collection('startups').orderBy('createdAt', 'desc').limit(400).get());
  ok('startups list query (store shape, 33 docs) succeeds');
  await expectFail('foreign founder updates st1', x.doc('startups/st1').update({ name: 'hack' }));
  await assertSucceeds(f.doc('startups/st1').update({ tagline: 'new' }));
  ok('owner updates own startup');
  await expectFail('owner hijacks ownership on update', f.doc('startups/st1').update({ ownerId: 'founderX' }));
  const createAs = db(auth('investor', I));
  await expectFail('investor cannot create startup', createAs.collection('startups').add({ ownerId: 'investor', id: 'zz', name: 'z' }));
  await expectFail('founder creates startup with foreign ownerId',
    f.collection('startups').add({ ownerId: 'investor', id: 'zz', name: 'z' }));
  await assertSucceeds(f.collection('startups').doc('stOwn').set({ id: 'stOwn', ownerId: 'founder', name: 'Mine', sector: 'SaaS' }));
  ok('founder creates own startup');
  await expectFail('foreign deletes startup', x.doc('startups/st1').delete());
  await assertSucceeds(adm.doc('startups/st1').update({ tagline: 'admin' }));
  ok('admin can edit any startup');
  // investors
  await assertSucceeds(f.doc('investors/investor').get());
  ok('founder reads investor listing (marketplace member-read)');
  await assertSucceeds(i.doc('investors/investor').get());
  ok('investor reads own investor profile');
  const i2 = db(auth('investorZ', 'investorZ@test.dev'));
  await expectFail('founder edits investor profile (owner-only)', f.doc('investors/investor').update({ firm: 'HACK' }));
  await expectFail('investor self-verifies (verified frozen)', i.doc('investors/investor').update({ verified: true }));
  await assertSucceeds(i.doc('investors/investor').update({ firm: 'Fund II' }));
  ok('investor edits own profile');
  await expectFail('foreign creates investors doc under other uid',
    i2.collection('investors').doc('investor').set({ id: 'investor', userId: 'investorZ', verified: false, active: true }));
  await assertSucceeds(adm.doc('investors/investor').update({ verified: true }));
  ok('admin can verify an investor');
}

/* ================================================================ 4. connections */
section('4. connections — participant-only, pending->accepted transitions');
{
  const f = db(auth('founder', F)), i = db(auth('investor', I)), x = db(auth('founderX', 'founderX@test.dev'));
  await assertSucceeds(f.doc('connections/connA').get());
  ok('startup-owner founder reads connection');
  await assertSucceeds(i.doc('connections/connA').get());
  ok('investor participant reads connection');
  await assertSucceeds(f.collection('connections').where('startupId', '==', 'st1').orderBy('createdAt', 'desc').limit(200).get());
  ok('founder connection list query (store shape) succeeds');
  await assertSucceeds(i.collection('connections').where('investorId', '==', 'investor').orderBy('createdAt', 'desc').limit(200).get());
  ok('investor connection list query (store shape) succeeds');
  await expectFail('non-participant founder reads connA', x.doc('connections/connA').get());
  await assertSucceeds(f.collection('connections').add({ startupId: 'stOwn', investorId: 'investor', fromRole: 'founder', message: 'hi', status: 'pending', createdAt: 3, stage: 'intro' }));
  ok('participant creates pending connection');
  await expectFail('creator cannot start as accepted', f.collection('connections').add({ startupId: 'stOwn', investorId: 'investor', fromRole: 'founder', message: 'hi', status: 'accepted', createdAt: 3, stage: 'intro' }));
  await expectFail('foreigner creates connection on st1', x.collection('connections').add({ startupId: 'st1', investorId: 'investor', fromRole: 'founder', message: 'hi', status: 'pending', createdAt: 3, stage: 'intro' }));
  await assertSucceeds(i.doc('connections/connP').update({ status: 'accepted' }));
  ok('participant accepts pending connection');
  await expectFail('accepted connection cannot flip back', i.doc('connections/connP').update({ status: 'declined' }));
  await expectFail('non-participant updates connection', x.doc('connections/connA').update({ status: 'declined' }));
  await assertSucceeds(f.doc('connections/connA').update({ stage: 'term-sheet' }));
  ok('participant advances opportunity stage');
  await expectFail('non-admin deletes connection', f.doc('connections/connP').delete());
}

/* ================================================================ 5. threads + msgs (budget + typing suspects) */
section('5. threads — participant-only + typingBy dotted-key + >10-doc get() budget');
{
  const f = db(auth('founder', F)), i = db(auth('investor', I)), x = db(auth('founderX', 'founderX@test.dev'));
  await assertSucceeds(f.doc('threads/th1').get());
  ok('participant reads thread meta');
  await expectFail('non-participant reads thread', x.doc('threads/th1').get());
  await assertSucceeds(f.collection('threads').where('pairIds', 'array-contains', 'founder').limit(100).get());
  ok('thread list query (store shape) succeeds');
  // batch accept + thread create exactly as store.respondConnection does
  const idb = db(auth('investor', I));
  const ib = idb.batch();
  ib.update(idb.doc('connections/connP'), { status: 'accepted' });
  ib.set(idb.collection('threads').doc('thB'), {
    connId: 'connP', createdAt: 9, pairIds: ['founderX', 'investor'], pair: [{ userId: 'founderX' }, { userId: 'investor' }], typingBy: {},
  });
  await assertSucceeds(ib.commit());
  ok('batch accept + thread create (store respondConnection shape) succeeds');
  // 40-msg list read where EVERY doc evaluation gets(thread parent) + users doc
  await assertSucceeds(f.collection('threads').doc('th1').collection('msgs').orderBy('ts', 'asc').limit(500).get());
  ok('40-msg list read (get() per doc) succeeds — no budget failure');
  await assertSucceeds(i.collection('threads').doc('th1').collection('msgs').doc('m5').get());
  ok('participant reads a msg');
  await expectFail('non-participant reads msgs subcollection', x.collection('threads').doc('th1').collection('msgs').doc('m5').get());
  await assertSucceeds(f.collection('threads').doc('th1').collection('msgs').doc('mn').set({
    id: 'mn', senderId: 'founder', ts: 999, text: 'yo', reactions: {},
  }));
  ok('participant posts a message (id == path, senderId=self — store setDoc shape)');
  await expectFail('participant cannot spoof senderId',
    i.collection('threads').doc('th1').collection('msgs').doc('mx').set({ id: 'mx', senderId: 'founder', ts: 999, text: 'x', reactions: {} }));
  // THE SUSPECT: dotted-key typing write
  await assertSucceeds(f.doc('threads/th1').update({ 'typingBy.founder': Date.now() }));
  ok('typingBy dotted-key update (store setTyping shape) succeeds');
  await assertSucceeds(f.doc('threads/th1').update({ 'typingBy.founder': 0 }));
  ok('typingBy dotted-key clear succeeds');
  await expectFail('non-participant cannot write typing', x.doc('threads/th1').update({ 'typingBy.founderX': Date.now() }));
  await assertSucceeds(f.collection('threads').doc('th1').collection('msgs').doc('m5').update({ reactions: { '👍': 1 } }));
  ok('participant reacts to a msg');
  await expectFail('typing update cannot change pairIds',
    f.doc('threads/th1').update({ 'typingBy.founder': Date.now(), pairIds: ['hacker'] }));
}

/* ================================================================ 6. channels */
section('6. channels — role-matched membership for meta, msgs, voice');
{
  const f = db(auth('founder', F)), i = db(auth('investor', I)), x = db(auth('founderX', 'founderX@test.dev'));
  await assertSucceeds(f.doc('channels/cF').get());
  ok('founder reads own-role channel meta');
  await expectFail('founder reads investor channel meta', f.doc('channels/cI').get());
  await expectFail('investor reads founder channel meta', i.doc('channels/cF').get());
  await assertSucceeds(f.collection('channels').where('role', '==', 'founder').get());
  ok('channel list query (store shape) succeeds');
  await assertSucceeds(f.collection('channels').doc('cF').collection('msgs').get());
  ok('founder reads own channel msgs');
  await assertSucceeds(f.collection('channels').doc('cF').collection('msgs').add({ authorId: 'founder', author: 'F', hue: 1, roleTag: 'F', ts: 2, text: 'yo', reactions: {} }));
  ok('founder posts in own channel');
  await expectFail('founder cannot spoof authorId',
    f.collection('channels').doc('cF').collection('msgs').add({ authorId: 'investor', author: 'I', hue: 1, roleTag: 'I', ts: 2, text: 'x', reactions: {} }));
  await expectFail('founder posts in investor channel', f.collection('channels').doc('cI').collection('msgs').add({ authorId: 'founder', author: 'F', hue: 1, roleTag: 'F', ts: 2, text: 'x', reactions: {} }));
  await expectFail('foreign-role reads founder voice presence', i.collection('channels').doc('cF').collection('voice').get());
  await assertSucceeds(f.collection('channels').doc('cF').collection('voice').doc('founder').set({ name: 'F', hue: 1, joinedAt: 1, muted: false }));
  ok('founder joins own-role voice lounge (doc id == uid)');
  await assertSucceeds(f.collection('channels').doc('cF').collection('voice').doc('founder').delete());
  ok('founder leaves voice lounge');
  await expectFail('voice doc id must equal uid',
    f.collection('channels').doc('cF').collection('voice').doc('investor').set({ name: 'I', hue: 1, joinedAt: 1, muted: false }));
  await expectFail('non-role member joins lounge',
    i.collection('channels').doc('cF').collection('voice').doc('investor').set({ name: 'I', hue: 1, joinedAt: 1, muted: false }));
  // unread watermark (users/{uid}/channelReads)
  await assertSucceeds(f.collection('users').doc('founder').collection('channelReads').doc('cF').set({ lastRead: 9 }));
  ok('owner writes channelReads watermark');
  await expectFail('watermark with extra key denied',
    f.collection('users').doc('founder').collection('channelReads').doc('cF').set({ lastRead: 9, nuke: true }));
  // founder cannot read another founder's channelReads (owner-only)
  await expectFail('foreign founder reads channelReads', x.collection('users').doc('founder').collection('channelReads').get());
}

/* ================================================================ 7. notices */
section('7. notices — self + validated cross-party only');
{
  const f = db(auth('founder', F)), i = db(auth('investor', I)), x = db(auth('founderX', 'founderX@test.dev'));
  await assertSucceeds(f.collection('users').doc('founder').collection('notices').add({
    type: 'system', title: 'hi', body: 'self', link: '/', ts: 1, read: false, by: 'founder', to: 'founder',
  }));
  ok('self-notice allowed');
  await expectFail('foreign user cannot forge notice to founder (no conn)',
    x.collection('users').doc('founder').collection('notices').add({
      type: 'connect', title: 'x', body: 'x', link: '/', ts: 1, read: false, by: 'founderX', to: 'founder',
    }));
  await expectFail('investor cannot notice a NON-counterparty (stX belongs to founderX, not founder)',
    i.collection('users').doc('founder').collection('notices').add({
      type: 'security', title: 'x', body: 'deck', link: '/', ts: 1, read: false, by: 'investor', to: 'founder', connId: 'connP',
    }));
  // connP is investor <-> founderX (stX) — target founderX IS the counterparty
  await assertSucceeds(i.collection('users').doc('founderX').collection('notices').add({
    type: 'connect', title: 'accepted', body: 'b', link: '/', ts: 1, read: false, by: 'investor', to: 'founderX', connId: 'connP',
  }));
  ok('counterparty notice via accepted connection allowed (deck-grant / accept shapes)');
  await assertSucceeds(f.collection('users').doc('founder').collection('notices').doc('n1').set({
    type: 'message', title: 't', body: 'b', link: '/', ts: 1, read: false, by: 'founder', to: 'founder',
  }));
  await assertSucceeds(f.collection('users').doc('founder').collection('notices').doc('n1').update({ read: true }));
  ok('owner marks own notice read');
  await expectFail('owner cannot edit notice content after creation',
    f.collection('users').doc('founder').collection('notices').doc('n1').update({ title: 'edited' }));
  await expectFail('non-owner marks notice read',
    x.collection('users').doc('founder').collection('notices').doc('n1').update({ read: true }));
  await expectFail('foreign reads founder notices', x.collection('users').doc('founder').collection('notices').get());
}

/* ================================================================ 8. rsvps + progress + events counter */
section('8. rsvp / progress (owner) + content events ±1 counter');
{
  const f = db(auth('founder', F)), x = db(auth('founderX', 'founderX@test.dev'));
  await assertSucceeds(f.collection('users').doc('founder').collection('rsvps').doc('ev1').set({ bookedAt: 5 }));
  ok('owner RSVPs');
  await assertSucceeds(f.collection('users').doc('founder').collection('progress').doc('tracks').set({ tr1: 1 }, { merge: true }));
  ok('owner records lesson progress');
  await expectFail('foreign writes founder rsvp', x.collection('users').doc('founder').collection('rsvps').doc('ev1').set({ bookedAt: 5 }));
  const guest = testEnv.unauthenticatedContext();
  await assertSucceeds(db(guest).doc('content/ev1').get());
  ok('guest reads event doc (store rsvp doc shape: doc(content,eventId))');
  await assertSucceeds(f.doc('content/ev1').update({ rsvpCount: 3 }));
  ok('member increments event counter by 1 (store rsvp update shape)');
  await assertSucceeds(f.doc('content/ev1').update({ rsvpCount: 2 }));
  ok('member decrements event counter by 1');
  await expectFail('counter cannot move by 2', f.doc('content/ev1').update({ rsvpCount: 4 }));
  await expectFail('member cannot edit event content', f.doc('content/ev1').update({ title: 'HACK' }));
  await assertSucceeds(f.doc('content/ev1').update({ rsvpCount: 1 }));
  await assertSucceeds(f.doc('content/ev1').update({ rsvpCount: 0 }));
  ok('counter drains to 0 legitimately');
  await expectFail('counter cannot go negative', f.doc('content/ev1').update({ rsvpCount: -1 }));
  await expectFail('guest cannot write events at all',
    db(guest).doc('content/ev1').update({ rsvpCount: 3 }));
  await expectFail('counter rule only applies to section=events', f.doc('content/fq1').update({ rsvpCount: 3 }));
  const adm = db(auth('admin', A));
  await assertSucceeds(adm.collection('content').doc('ev2').set({ title: 'New', seats: 5, rsvpCount: 0, section: 'events' }));
  ok('admin authors content doc');
  await assertSucceeds(adm.collection('content').doc('nw1').set({ title: 'T', ts: 1, section: 'news' }));
  ok('admin authors news doc');
}

/* ================================================================ 9. audits + flags */
section('9. audits & flags — admin-only read/resolve, member create');
{
  const f = db(auth('founder', F)), adm = db(auth('admin', A));
  await expectFail('member cannot read audits', f.collection('audits').get());
  await assertSucceeds(adm.collection('audits').get());
  ok('admin reads audits');
  await assertSucceeds(adm.collection('audits').orderBy('ts', 'desc').limit(300).get());
  ok('audit list query (store shape) succeeds');
  await expectFail('member cannot forge audit actor email',
    f.collection('audits').add({ ts: 1, actor: 'admin@test.dev', action: 'X', target: 'y' }));
  await assertSucceeds(f.collection('audits').add({ ts: 1, actor: 'founder@test.dev', action: 'SESSION_LOGIN', target: 'self' }));
  ok('member appends audit with own email (store audit() shape)');
  await expectFail('nobody can update audits', adm.collection('audits').doc('au1').update({ action: 'ERASED' }));
  await expectFail('member cannot read flags', f.collection('flags').get());
  await assertSucceeds(adm.collection('flags').get());
  ok('admin reads flags');
  await assertSucceeds(f.collection('flags').add({ content: 'c', author: 'founder', reason: 'r', ts: 2, status: 'open' }));
  ok('member files a flag (open)');
  await expectFail('member cannot create resolved flag',
    f.collection('flags').add({ content: 'c', author: 'founder', reason: 'r', ts: 2, status: 'resolved' }));
  await assertSucceeds(adm.collection('flags').doc('fl1').update({ status: 'resolved' }));
  ok('admin resolves a flag');
  await expectFail('member cannot resolve a flag',
    f.collection('flags').doc('fl1').update({ status: 'open' }));
  await expectFail('even admins cannot delete audits', adm.collection('audits').doc('au1').delete());
}

/* ================================================================ 10. storage */
section('10. Storage — deck reads bound to deck.sharedWith; thread files participant-only');
{
  const fOwner = st(auth('founder', F));
  const iShared = st(auth('investor', I));
  const iZ = st(auth('investorZ', 'investorZ@test.dev'));
  const x = st(auth('founderX', 'founderX@test.dev'));
  try {
    await assertSucceeds(fOwner.ref('decks/st1/d.pdf').getDownloadURL());
    ok('deck owner reads own deck file');
    await assertSucceeds(iShared.ref('decks/st1/d.pdf').getDownloadURL());
    ok('shared investor reads deck file (sharedWith gate)');
    await expectFail('unshared investor cannot read deck', iZ.ref('decks/st1/d.pdf').getDownloadURL());
    await expectFail('foreign founder cannot read deck', x.ref('decks/st1/d.pdf').getDownloadURL());
    await expectFail('unshared investor cannot upload over deck',
      (async () => { await iZ.ref('decks/st1/hack.pdf').putString('X'); })());
    await assertSucceeds(fOwner.ref('decks/st1/v2.pdf').putString('NEW'));
    ok('deck owner uploads/replaces deck file');
    await expectFail('foreign founder cannot write deck', x.ref('decks/st1/hack.pdf').putString('X'));
    await assertSucceeds(iShared.ref('files/threads/th1/x/m-1.pdf').getDownloadURL());
    ok('thread participant reads room attachment');
    await assertSucceeds(iShared.ref('files/threads/th1/x/m-2.pdf').putString('ATTACH'));
    ok('thread participant uploads room attachment');
    await expectFail('non-participant cannot read room attachment', x.ref('files/threads/th1/x/m-1.pdf').getDownloadURL());
    await expectFail('non-participant cannot upload into room', x.ref('files/threads/th1/x/m-9.pdf').putString('X'));
    await expectFail('unauth read of deck', testEnv.unauthenticatedContext().storage(`gs://${BUCKET}`).ref('decks/st1/d.pdf').getDownloadURL());
  } catch (e) {
    failed.push(`storage section raised: ${e?.code ?? ''} ${e?.message}`);
    console.error(`  \u2717 storage section aborted: ${e?.code ?? ''} ${e?.message}`);
  }
}

/* ------------------------------------------------------------ summary */
console.log(`\n${'='.repeat(64)}\nPASSED ${passed}  FAILED ${failed.length}`);
if (failed.length) {
  console.error('\nFailures:');
  for (const f of failed) console.error(`  - ${f}`);
  process.exitCode = 1;
}
await testEnv.cleanup();
