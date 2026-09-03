# VentureSetu — Firebase Production Guide

Everything in this app now runs on a **real Firebase backend (Spark — the 100%
free plan: no credit card, no trial expiry)**. There is no demo data, no
localStorage business data and no simulated auth. This file is the operator's
manual: schema, security rules, one-time console setup, deploy, seed and the
live-demo checklist.

> App code locations: `src/lib/firebase.ts` (env bootstrap), `src/lib/store.tsx`
> (all reads/writes), `firestore.rules` + `storage.rules` (server-side
> enforcement), `scripts/seed-content.mjs` (optional editorial import).

---

## 1. Firestore schema (collections → documents)

Field names match `src/lib/types.ts` 1:1 so UI code needs no adapter.

| Collection path | Contains | Written by |
|---|---|---|
| `users/{uid}` | `User` doc. Identity, role, status, onboarded. The ONLY role source of truth. | App after email verification; admins |
| `users/{uid}/notices` | `Notice` docs — per-user inbox | Self + the *other party* of an accepted connection (rules-validated) |
| `users/{uid}/rsvps/{eventId}` | `{ bookedAt }` | Owner only |
| `users/{uid}/channelReads/{channelId}` | `{ lastRead }` unread watermark | Owner only |
| `users/{uid}/progress/tracks` | `{ [trackId]: lessonsDone }` | Owner only |
| `startups/{sid}` | `Startup` doc incl. `deck` metadata (`name`, `sizeKB`, `updatedAt`, `path`, `sharedWith`) | Owner founder; admins |
| `investors/{iid}` | `Investor` doc — **profile id == the user's uid** | Owner investor; admins |
| `connections/{cid}` | `Connection` — `{ startupId, investorId, fromRole, message, status, stage, createdAt }` | The two counterparties |
| `threads/{tid}` | `Thread` meta: `{ connId, pair, pairIds, typingBy }` | Created on acceptance; typing indicator updates |
| `threads/{tid}/msgs/{mid}` | `Msg` — private-room chat | Thread participants |
| `channels/{cid}` | `Channel` meta `{ role: 'founder'\|'investor', kind: 'text'\|'voice', name, desc, order }` — community servers are **role-scoped** | Seed script / admins |
| `channels/{cid}/msgs/{mid}` | `ChannelMsg` | Members of that channel's role |
| `channels/{cid}/voice/{uid}` | Voice-lounge presence `{ name, hue, joinedAt, muted }`, doc id == uid | Self |
| `content/{id}` (with `section` ∈ events\|tracks\|schemes\|news\|faqs\|market) | Editorial content (public) | Seed script / admins; `section=events` docs: `rsvpCount` ±1 by members |
| `audits/{aid}` | `Audit` — append-only trail | Members (client-side, Spark-compatible); **read = admin only** |
| `flags/{fid}` | `Flag` — reports | Members; resolve = admin only |

Notable design choices:

* **No `sessions` collection / no password hashes.** Firebase Auth owns
  credentials and sessions server-side (the `Session` type in
  `src/lib/types.ts` is legacy and unused).
* **Investor profile id == their uid**, so "only I can edit my investor
  profile" is a path check, and `deck.sharedWith` entries are investor uids
  that Storage rules can match directly against `request.auth.uid`.
* **Threads store `pairIds`** so both membership checks
  (`array-contains` queries and rules `hasAny`) are trivial.
* **Deck `path` is a Storage object path**; actual file bytes live in
  `gs://<bucket>/decks/<startupId>/<file>`. `sharedWith` on the startup doc is
  the *write*-side access list; the *read*-side gate is re-verified by
  Storage rules.
* **Audits are client-written** because Spark has no free server-side writes
  (Cloud Functions would push this out of the free tier's comfortable zone).
  Rules make them admin-readable and immutable; see §8 for the hardening path.

---

## 2. Security Rules — what is enforced where

Full files: [`firestore.rules`](../firestore.rules), [`storage.rules`](../storage.rules).

| Threat / claim | Enforced by |
|---|---|
| A founder reads another user's private doc (`users/{uid}`, notices, rsvps, progress, channelReads) | Firestore rules — read owner-or-admin only |
| Role change via devtools | `users` update rule freezes `role/status/email/verified/id/createdAt` for self-writes |
| Suspended user keeps acting | Rules call `isActiveMember()` (reads `users/{uid}.status`) before every non-trivial read/write |
| Founder writes an investor's profile / vice versa | `investors/{iid}` requires `iid == request.auth.uid` + role check; `startups` writes require `ownerId == auth.uid` |
| Reading a connection/thread you're not part of | Participant checks (`investorId`/`startupOwner`, `pairIds`) |
| Posting in the *other* role's community server | `channels` rules compare your `users.role` to the channel's `role` |
| Forging notifications to another user | Cross-user `notices` create requires an **accepted connection doc** whose other party is the target |
| Grabbing a deck without permission | Storage rules — file read requires owner **or** uid in `startup.deck.sharedWith` |
| Reading audits / resolving flags as a normal user | Read on `audits`/`flags` is `isAdmin`-only; flags resolution is `isAdmin`-only |
| Tampering with the audit trail | `audits` allows no update/delete |
| Unverified account creating data | `users` create requires `email_verified` token claim; app additionally blocks actions pre-verification |
| Deck share list edited by someone else | `startups` update is owner-only; `deck.sharedWith` only moves via owner actions |

Computed match scores (`src/lib/match.ts`) stay **client-side** — they read the
same gated Firestore docs the UI already shows, so no scores leak that
wouldn't otherwise. No Cloud Functions are needed on Spark.

---

## 3. One-time console setup (≈ 15 minutes)

1. **Create the project**
   [console.firebase.google.com](https://console.firebase.google.com) →
   *Add project* → name it (e.g. `venturesetu-sih`) → Google Analytics off
   (not needed). Spark plan is automatic; **no billing, no card**.

2. **Register a Web app**
   Project settings → *Your apps* → `</>` → nickname `venturesetu-web` → copy
   the `firebaseConfig` block → write it to a local `.env` file (from
   [`.env.example`](../.env.example)):

   ```bash
   cp .env.example .env   # then paste your six VITE_FIREBASE_* values
   ```

   These six values are public by design (web apps ship them to the browser);
   **never** put service-account keys in `.env`.

3. **Enable Email/Password auth**
   Build → *Authentication* → *Get started* → *Sign-in method* → enable
   **Email/Password** → save. (Do *not* enable anonymous.) Optionally in
   *Settings*: turn on "Email enumeration protection".

4. **Firestore in production mode**
   Build → *Firestore Database* → *Create database* → choose location (e.g.
   `asia-south1` for India) → **Production mode** → create.

5. **Storage**
   Build → *Storage* → *Get started* → same region → default rules (they get
   replaced by our rules in step 7).

6. **Create your admin account**
   - Authentication → *Users* → *Add user* → your admin email + password.
   - Open the new user's row, copy the **UID**.
   - Firestore → `users` collection → *Add document* with **Document ID =
     that UID** and fields:

     ```json
     {
       "id": "<the uid>",
       "name": "Platform Admin",
       "email": "<your admin email>",
       "role": "admin",
       "status": "active",
       "verified": true,
       "mfa": false,
       "hue": 232,
       "createdAt": <ms epoch, e.g. 1735699200000>,
       "onboarded": true
     }
     ```

   Admins are created in the console (the app's signup intentionally cannot
   mint `role: admin`). This doc is what makes your login an admin session.

7. **Deploy rules, indexes, then the app** — section 4.

---

## 4. Deploy commands

Install the Firebase CLI (globally once, or use `npx firebase` everywhere):

```bash
npm install -g firebase-tools
firebase login                       # opens your Google account in a browser
```

Every command below can take `--project <project-id>`; run `firebase use
<project-id>` once to make it the default instead.

```bash
# 1) Security rules + composite indexes (free, instant)
firebase deploy --only firestore:rules,firestore:indexes,storage

# 2) Optional editorial content (events/tracks/schemes/news/faqs/market + channels)
#    Needs a service-account key: Console -> Project settings -> Service accounts
#    -> Generate new private key. Keep it OUT of git.
npm run seed:content -- --project <project-id> --key ./venturesetu-service-account.json

# 3) Production build + hosting deploy (your live URL)
npm run build
firebase deploy --only hosting
# -> https://<project-id>.web.app  (and .firebaseapp.com)

# Later updates: rules or app only
firebase deploy --only firestore:rules,firestore:indexes,storage
npm run build && firebase deploy --only hosting
```

The two composite indexes (connections by `investorId`/`startupId` +
`createdAt`) are in [`firestore.indexes.json`](../firestore.indexes.json) and
deploy with step 1. If you ever see a console link offering to "create the
missing index", that is an alternative way to add them.

---

## 5. Env config & verified flows (what "real" means here)

All credentials arrive via `VITE_FIREBASE_*` (read in `src/lib/firebase.ts`);
without them the app boots into a single clear error screen — there is no
fallback data anywhere.

| Flow | Mechanism |
|---|---|
| Signup | `createUserWithEmailAndPassword` → real verification email → the `users/{uid}` doc is created **only after** the token reports `emailVerified` |
| Login | `signInWithEmailAndPassword` + token `reload()`; suspended accounts are refused and signed out |
| Password reset | `sendPasswordResetEmail` — link is handled entirely by Firebase |
| Session | Firebase persistent session (survives refresh); never in localStorage |
| Live data | `onSnapshot` listeners on every list above (messages, typing, channel chat, voice presence, notices, counters) |
| Deck upload | `uploadBytes` to Storage; owner-only writes; reads verified against `deck.sharedWith` |
| Verification email | `sendEmailVerification` / resend on the verify screen |

**MFA note:** real TOTP MFA requires the optional *Identity Platform* upgrade,
whose free allowance (50 MAU) is far below plain Auth's (50,000 MAU). To stay
100% free with no card, MFA enrollment is **off**; the signup checkbox explains
this and `mfa` is stored per-user so it can be flipped on later (see §8).

---

## 6. Live demo checklist (two real accounts)

> Full scripted walkthrough (timed, with per-step verification and failure
> fallbacks): **docs/DEMO.md**. The checklist below is the condensed version.

1. Two devices / two private windows: sign up **founder@…** and
   **investor@…** (real inboxes, real verification links).
2. Founder: onboarding → create venture; attach a real PDF deck.
3. Investor: onboarding → investor profile.
4. Founder: Matching → investor appears with a real score → *Connect*.
5. Investor: Connections → *Accept* → both land in a private room.
6. Type in the room on device A → **typing indicator** on device B; send a
   file attachment; both sides update without refresh.
7. Founder: Startup profile → grant deck access → investor sees a working
   preview → revoke → preview dies (Storage rules).
8. Community: each role only sees its own channels; post a message, watch it
   stream in the other window.
9. RSVP on an event → the seats-left counter ticks on both windows.
10. Admin account: suspend the investor user → their next action fails
    server-side; resolve a flag; view the audit trail.

---

## 7. Content import — what it is and isn't

`npm run seed:content` writes **editorial content and channel configuration
only** — the events/learning/schemes/news/FAQ/marketplace pages would render
empty without it. It writes zero user-like data: no people, startups,
connections, messages, audits or flags. Events import with `rsvpCount: 0` so
counters reflect only real RSVPs. If you prefer a blank site, simply skip the
command — the pages show proper empty states.

---

## 8. Honest audit of residual trade-offs (before judging)

* **Client-written audits** — members can append audit lines (they cannot
  read/alter others'). For strict server-side auditing, move `audit()` calls
  into a Cloud Function (would still fit free quota at this volume) and make
  `audits` admin-write-only.
* **Event counter** — rules allow any active member to move `rsvpCount` by
  ±1; a malicious client could oscillate it. A Cloud Function or a
  transactions-guarded admin counter removes that. Seats can't be overbooked
  via the UI because RSVP create checks are owner-scoped; worst case is
  cosmetic drift.
* **MFA is off by design** — needs Identity Platform (billing-enabled) for
  real TOTP. Stored `mfa` intent is ready to flip.
* **Verified-investor badge** — the `verified` field can only be set by an
  admin (rules freeze it for self-writes); no admin UI exists yet, edit the
  doc in the console.
* **Reactions/typing are best-effort participant writes** — a participant can
  only affect their own thread's `typingBy` key; reaction tallies could in
  theory be overwritten by a participant. Cosmetic risk, participant-only.
* **Cloud Functions: none used** — everything above runs on the free Spark
  tier with zero functions, so there is no invocation budget to exceed.
* **Landing page copy is now honest by construction** — no invented
  members, testimonials or metrics. The hero stats are true platform facts
  (0 seeded rows, 2 roles, 6 steps, 1 free tier); the network diagram uses
  role placeholders ("Founder · SaaS"); the dashboard mock-up and floating
  deal cards are explicitly labeled "Sample view / illustrative"; the
  marquee lists capabilities, not fake members. The only static claims left
  are product-behavior descriptions, verified in docs/DEMO.md.
* `localStorage` is used for exactly one non-business preference: the
  UI language (`vs_lang`).

Everything else — profiles, matches, connections, messages, community,
tracker, notifications, decks, admin — reads and writes real Firestore
documents with no seed and no fallback.
