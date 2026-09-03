# Two-Account Live Demo — script

Run this with two **real** accounts in front of judges. Everything shown is a
real Firestore read or write through the deployed app — no seed data, no
fallbacks, no mocked personas.

- **Total time:** ~12 minutes (incl. two email verifications)
- **Requires:** the deployed URL (docs/FIREBASE.md §6), two working email
  inboxes, two separate browser profiles.

---

## 0. Prerequisites (5 min, do before the judges arrive)

1. Deploy is live (`firebase deploy` — docs/FIREBASE.md §6).
2. Open two browser profiles that do **not** share storage:
   - Profile A = normal Chrome window
   - Profile B = Chrome **Incognito** window (or a second browser: Edge/Firefox)
3. Have the two verification emails ready to open (Gmail tabs pre-loaded for
   `founder@…` and `investor@…`).
4. Have one small PDF handy on each machine profile for the deck upload
   (any PDF ≤ 25 MB; e.g. rename a 2-page doc to `pitch-deck.pdf`).
5. Sanity check: visit the live URL from both profiles — the Landing page
   loads (hero stats show `0` seeded rows). If a browser shows the
   "Firebase is not configured" banner, the env/deploy is broken — stop.

---

## Part A — Founder journey (Profile A) · ~4 min

**A1. Sign up.** `Sign up` → founder role → `Full name`, `Work email`, strong
password → `Create account`.

- Verify: the *"Verification email sent"* step appears with the email shown.
  The account is NOT usable until verified — say this out loud: it is a real
  gate.

**A2. Verify.** Open the verification link in the email tab (it opens a new
tab — leave it), then return to Profile A and press *"I've verified —
continue"*.

- Verify: you land on the 5-step onboarding wizard (You → Startup → The plan
  → Financials → Review). No crash, no bounce back to the signup form.

**A3. Onboarding.** Fill step 1 (role, phone, city, one qualification) →
step 2 (startup name, tagline, sector, stage) → step 3 (2 sentences, optional
but fill them for the demo) → step 4 (keep defaults; **don't** upload the
deck here) → **Launch profile**.

- Verify: you land on `/app/dashboard` and the dashboard shows the venture —
  readiness score, runway, KPI cards, live matches section. This data came
  from the real Firestore doc the wizard just created.

**A4. Upload the deck (deferred to the share demo).** Go to
`/app/startup/own` (Profile) and note where the *"Upload deck"* control sits —
you'll use it in Part E. Do not upload yet.

**A5. (30s, optional) Make the matching visible.** Note the venture's sector /
stage / ask on the dashboard. The investor you create in Part B will score
against exactly this data.

## Part B — Investor journey (Profile B) · ~3 min

**B1. Sign up** as investor (same flow as A1–A2, investor role).

**B2. Onboard** as an investor: firm name, title, check size, sectors, stages
(choose the founder's sector + stage for a high match score).

- Verify: you land on the **investor** dashboard (different shell — deal-flow
  KPIs, not founder KPIs).

**B3. Open Match** (`/app/matching`). The founder's venture should appear in
the ranked list **with a match score and "why" breakdown** (sector/stage/
cheque/geo).

- Verify: the score changed when you picked the founder's sector at B2 — this
  is `src/lib/match.ts` scoring real docs, not a canned number.

## Part C — Connect · ~1.5 min

**C1. Investor → founder.** In Profile B's matching list (or the startup's
public profile), click **Connect / request intro**, paste a real message
("We back early-stage climate, keen to see the deck"), send.

- Verify: the request appears as *pending* on the investor's pipeline.

**C2. Founder accepts.** In Profile A: Notifications (bell) shows a real
notice → open the connection request → **Accept**.

- Verify: the connection flips to *accepted* on BOTH sides within ~1s
  (watch Profile B's pipeline update without a refresh — that's an
  `onSnapshot` listener).

## Part D — Live messaging · ~3 min (the centerpiece)

**D1. Open the room.** From either side, open the thread (Chat). This thread
is a Firestore document with participant-scoped read rules — prove it:
copy the URL, open it in a *third* incognito profile that is signed out → it
redirects to login / denies (rules enforcement, not just UI hiding).

**D2. Founder types first.** In Profile A type "Here's the one-pager summary —
full deck incoming 👋" and send.

- Verify: Profile B sees it **instantly without refresh**. Watch for the
  message count / last-message row updating in B's Chat list too.

**D3. Investor replies + typing indicator.** In Profile B start typing (don't
send yet). Profile A should show *"typing…"* in ~1s. Send the reply.

- Verify: A sees the reply instantly, and the typing indicator disappears.

**D4. (30s) Reactions + file.** React to a message with an emoji on one side —
the tally updates on the other. Then send a small file (any image) from A;
B sees it with a download button.

## Part E — Deck sharing & revocation · ~2.5 min (the trust demo)

**E1. Upload.** Profile A: `/app/startup/own` → **Upload deck** → pick the
PDF. Toast confirms the upload went to Firebase Storage.

**E2. Share with the investor.** Toggle/choose *"Share with [investor]"* —
this writes the investor's uid into `startup.deck.sharedWith` (rules-gated).

- Verify in Profile B: the investor can now **open/download the PDF** from the
  startup profile or the thread. Show it renders as a real file.

**E3. Revoke.** Profile A toggles sharing off.

- Verify in Profile B: pressing the deck button now shows
  *"you don't have access"* / the download fails **without a page reload** —
  the Storage rule evaluated against the updated `sharedWith` on demand.

**E4. (Optional, +1 min) Show the audit trail.** As an admin you'd see the
`audits` collection (SESSION_LOGIN, ONBOARDING_COMPLETE, DECK_SHARE/REVOKE).
If you have no admin UI yet, open the Firestore console live and filter
`audits` — the demo's actions are all there.

---

## F. Verify-at-a-glance checklist

| # | Moment | What must happen | Req |
|---|--------|------------------|-----|
| A1–A2 | Signup + verify | Real verification email, gate until verified | 3 |
| A3 | Launch profile | Wizard writes user + startup docs; dashboard renders them | 1, 4 |
| B3 | Matching | Investor sees founder scored from live docs | 8 |
| C1–C2 | Connection | Pending → accepted flips live on both sides | 6 |
| D2–D3 | Messaging | Both sides see messages + typing indicator instantly | 6 |
| D4 | Reactions/file | Tally + file transfer live | 6, 7 |
| E2–E3 | Deck share/revoke | Investor gains then loses access, no reload | 5, 7 |
| E4 | Audit trail | Every action above logged in `audits` | 5 |

## G. If something breaks (say these exact things)

- **Email doesn't arrive** → check spam; use *"Didn't receive it? Resend"*;
  the gate is intentional.
- **Match list empty** → the founder's venture doc wasn't created; check the
  dashboard shows it before starting Part B.
- **Message doesn't appear live** → hit refresh once; listeners reconnect —
  then continue (one refresh is not a failure of the feature; two in a row is
  worth a genuine pause).
- **Deck download denied** → that's the feature (revoked). If it fails *while*
  shared, check the investor's uid is in `sharedWith` (console) and that the
  investor is signed into Profile B.

## H. Local rehearsal (no deploy needed)

`npm run emulators` + `npm run dev` + `.env` with `VITE_USE_EMULATORS=1`
rehearses the exact same script against local emulators — including the
verification emails (the emulator prints the verify links to its log). Two
browser profiles still required. Data resets on emulator restart.