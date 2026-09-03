# VentureSetu — run doc

## Reproduce the uncommitted artifacts a fresh checkout needs

1. `npm install` (dependencies: react, react-dom, firebase, firebase-admin (devDeps: firebase-tools, @firebase/rules-unit-testing), vite, typescript, tailwind v4).
2. Copy `.env` from the main checkout into the project root — never commit it. It holds the six public `VITE_FIREBASE_*` web-app values **plus** `VITE_USE_EMULATORS=1`, which routes all Firebase SDK calls to local emulators (ports 9099/8080/9199). For a production build against a real Firebase project, omit `VITE_USE_EMULATORS` and paste real values from the Firebase console (see `.env.example`). No other env files are needed.
3. Local emulators (optional; required for full auth/signup flows): `npm run emulators` — starts Auth (9099), Firestore (8080), Storage (9199) on the `demo-venturesetu` project. Firestore/Storage rules are loaded from `firestore.rules` / `storage.rules` automatically; the `emulators` block in `firebase.json` is required for the Auth emulator to start.

## Run the server

- Dev server (default port 5173): `npm run dev`
- Preview the production build: `npm run build && npm run preview`
- Windows detached start (outlives the shell):

  ```powershell
  powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
  ```

  stdout and stderr must go to DIFFERENT files. Confirm with `Get-Process -Id <pid>` and check the URL answers (`curl http://localhost:5173/`) before registering a preview.
- App boots to `/signup`; with emulator mode active, signup + the verification-email step work against the Auth emulator (fetch the OOB link from `http://127.0.0.1:9099/emulator/v1/projects/demo-venturesetu/oobCodes`).
- Other scripts: `npm run test:rules` (rules execution suite against local emulators), `npm run seed:content` (optional editorial import — needs a service account).
