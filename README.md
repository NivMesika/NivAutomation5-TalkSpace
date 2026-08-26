# NivAutomation5-TalkSpace

Playwright + TypeScript E2E for Talkspace canary signup: registration and email verification on `/signup/autoswitchpt`.

## Prerequisites

- Node.js 18+
- npm
- Google Chrome (tests use the real Chrome channel, not bundled Chromium)

## Setup

```bash
npm ci
cp .env.example .env
npx playwright install chrome
```

`.env` is gitignored. `BASE_URL` defaults to `https://app.canary.talkspace.com`. Optional: `LOG_LEVEL` (`ERROR` / `WARN` / `INFO` / `DEBUG`) and `SIGNUP_DEFAULTS_FILE` to point at a different JSON defaults file.

## Running

```bash
npm run headed      # visible Chrome; HTML report opens when the run finishes
npm run headless    # Chrome, no window; HTML report opens when the run finishes
npm run report      # reopen the last HTML report
npm run typecheck
```

The HTML report is the reviewer view: pass/fail, `test.step` timeline, screenshot, and (on failure) a Playwright trace. Terminal output is the list reporter.

## Tests

Ten independent cases in [`tests/e2e/signup.spec.ts`](tests/e2e/signup.spec.ts). They run in parallel (`fullyParallel`). Each run generates a unique Mailinator address; canary accounts are not deleted afterward.

| ID | Coverage |
|---|---|
| TS-01 | Empty required fields stay on signup |
| TS-02 | Invalid email format |
| TS-03 | Password too short and too weak |
| TS-04 | Nickname with special characters |
| TS-05 | Non-US country hides State |
| TS-06 | US registration reaches email verification |
| TS-07 | Existing email stays unverified (does not enter the app) |
| TS-08 | Invalid OTP / invalid verification link |
| TS-09 | Resend verification |
| TS-10 | Happy path: Mailinator inbox → verify email |

Canary A/B-tests verification: 6-digit OTP **or** a verify link. Page objects handle both. TS-10 opens Mailinator in a separate browser context so it does not steal the Talkspace session, then completes whichever variant is showing.

Invalid samples and defaults live in [`support/data/signup-defaults.json`](support/data/signup-defaults.json).

## Architecture

```
tests/e2e/signup.spec.ts            Thin orchestration: TS-01 … TS-10
support/test-base.ts                Fixtures: pages, testUser, signupDefaults
support/test-tags.ts                Priority tags
support/pages/                      POM (Signup, Email verification, Mailinator, Navigation)
support/data/                       JSON defaults and invalid samples
support/utils/                      Unique generators, types, logger
support/constants/                  Paths, API URL matches, asserted copy
```
