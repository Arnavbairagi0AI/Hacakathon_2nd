# VentureSetu

Founder–investor matchmaking platform (Smart India Hackathon build) — React 19 +
TypeScript + Vite on a **real Firebase backend (Spark, free forever)**.

**The data layer is real.** Authentication is Firebase Auth (verification
emails, password resets, persistent sessions). Every dashboard, match,
connection, private message, community channel, notification, tracker entry
and pitch deck lives in Firestore / Storage behind production Security Rules.
There is **no seed data, no demo fallback, no localStorage business data** —
the database starts empty and fills only through real signups and actions.

## Quickstart (dev)

```bash
cp .env.example .env        # paste your Firebase web-app config
npm install
npm run dev                 # http://localhost:5173
```

## Going live (one-time, ≈ 15 min)

1. Create a Firebase project (Spark) and a web app — see **§3** of
   [`docs/FIREBASE.md`](docs/FIREBASE.md) for exact console steps (Auth
   email/password, Firestore production mode, Storage, admin account).
2. Deploy rules + indexes, optionally import editorial content, then build
   and deploy hosting:

```bash
firebase login
firebase deploy --only firestore:rules,firestore:indexes,storage
npm run seed:content -- --project <project-id> --key <service-account>.json   # optional content
npm run build && firebase deploy --only hosting
```

## Security rules test suite

Run the rules **before** deploying against any real project (local emulators, no credentials):

```bash
npm run test:rules   # compiles firestore.rules + storage.rules and executes 125 access-matrix assertions
```

## Repository map

| Path | Purpose |
|---|---|
| `src/lib/firebase.ts` | Env bootstrap (strict `VITE_FIREBASE_*` validation) |
| `src/lib/store.tsx` | The whole data layer — Firebase Auth actions + typed `onSnapshot` projections |
| `src/lib/types.ts` | Firestore schema types (1:1 with collections) |
| `src/lib/match.ts` | Real match scoring over live docs |
| `firestore.rules` / `storage.rules` / `firestore.indexes.json` | Server-side security + indexes |
| `scripts/seed-content.mjs` + `content-seed.json` | Optional editorial content import (never user data) |
| `docs/FIREBASE.md` | Schema, rules, console setup, deploy, audit |
| `docs/DEMO.md` | Scripted two-account live demo (matching, messaging, deck share/revoke) |

## Docs

- **[docs/FIREBASE.md](docs/FIREBASE.md)** — schema design, security-rules
  matrix, exact Firebase console steps, deploy commands and the
  residual-trade-offs audit.
- **[docs/DEMO.md](docs/DEMO.md)** — the scripted two-account live demo for
  judges: signup/verify, matching, real-time messaging and revocable deck
  sharing, with per-step verification and failure fallbacks.
