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
| TS-03 | Should reject passwords that do not meet security requirements |
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

Prompts I used:

1. Let's focus only on Part 1 — Automation for now.

Before implementing anything, I want you to carefully plan 10 automated tests for the signup flow:

https://app.canary.talkspace.com/signup/autoswitchpt

The tests need to cover:
- Signup
- Registration
- Email verification

Architecture I want from the start:

- Playwright + TypeScript
- Classic POM
- Thin specs — they should mostly just orchestrate the scenario
- Page Objects own locators, flows, and assertions
- A Pages aggregator injected through fixtures (so specs use something like `pages.signup`, `pages.emailVerification`, etc.)
- Project structure around:
  - tests/e2e
  - support/pages
  - support/constants
  - support/utils
  - support/data
- Data-driven testing where it actually helps (invalid samples, defaults, unique users per run)
- Global setup / teardown only if we really need it (auth, cleanup, shared env). Don't add it just because frameworks often have it.
- Don't over-engineer this. keep it maintainable.

Use Playwright MCP to inspect the real application. Don't guess the flow, validations, or locators.

Use it to:
- Walk the registration flow end to end
- Understand each step and what actually validates
- Inspect email verification (including whatever UI the app actually shows)
- Find reliable locators — prefer getByRole / getByLabel / getByText over brittle CSS
- Look at network/API behavior if it's useful
- Call out realistic negative / edge cases
- Figure out what test data has to be unique per run

First step is planning only. Do not write the tests yet.

After you inspect the app, give me:
1. The proposed 10 test cases
2. What each one validates
3. Why it deserves a slot in a set of only 10
4. Positive vs negative / boundary
5. Required test data
6. Any dependencies or cleanup
7. The proposed project structure
8. Whether global setup/teardown is actually needed, and why

Tests must be independent and safe to run in parallel — no test should depend on another one having run first.

Prioritize meaningful coverage over trying to test every possible field validation.


2. Ok, I reviewed the plan. I want to tighten both the **10 tests** and some of the framework decisions before we continue.

### Test coverage

We're using too many slots on very similar client-side validations.

Empty fields, invalid email, short password, weak password, and nickname validation are all valid scenarios, but they shouldn't consume half the suite.

Combine related cases where it makes sense. 

I want the final 10 tests to focus on the actual **signup → registration → email verification journey**, with a good balance between validation and real business flows.

The full happy path should register a unique user, read the real verification email using Mailinator or the available mailbox solution, and complete verification.

### Architecture changes

I also reviewed the initial framework structure and want to simplify a few things:

* Don't use 3 nested `describe` blocks. One `test.describe` for this suite is enough.
* Don't add separate timeout objects for every part of the application. It makes the tests unnecessarily long. Rely on Playwright's normal timeout configuration and only use a specific timeout where there is a real reason, such as waiting for an external email.
* Don't use `test.describe.parallel`.

  * Set `fullyParallel: true` in `playwright.config.ts` instead.
  * (Tests should be independent and parallel-safe by default,If we ever have a suite where tests genuinely depend on each other, we can explicitly override that suite with `test.describe.serial`.)
* Remove the suite tag that only describes the area being tested. It doesn't add value here.
* Don't create a separate file just for `loadSignupDefaults`. Keep that logic in `test-base.ts`.
* Keep specs thin. Page Objects own locators, flows, and assertions.
* Continue using the `Pages` aggregator through fixtures.
* Keep `support/{pages, constants, utils, data}` and avoid creating extra abstractions unless they're actually useful.

### Next step

First, show me the **revised final 10 tests** and briefly note what was merged, removed, or replaced from the original plan.

Then implement the revised plan.

Use Playwright MCP whenever you need to confirm application behavior or locators instead of guessing.

While implementing:

* Keep the tests readable and concise
* Use unique test data where needed
* Use data-driven testing where it improves the test rather than just adding abstraction
* Keep tests independent and parallel-safe
* Avoid unnecessary helpers/files/configuration
* Prefer Playwright auto-waiting and web-first assertions over manual waits
* Only increase timeouts for operations that genuinely need it, such as external email delivery

After implementation, review the result once more for unnecessary complexity, duplication, flaky waits, and anything that doesn't match the actual application behavior.

