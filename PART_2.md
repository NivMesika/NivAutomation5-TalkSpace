# Part 2 — AI Use Reflection

- I used Cursor + Playwright MCP to inspect the live signup flow before implementing the tests, including validations, country/state behavior, registration, email verification, and reliable locators. I also used AI to help draft the initial 10-test plan and scaffold the Playwright + TypeScript POM architecture.

- I didn't accept the initial test plan as-is. It spent too many of the 10 available tests on similar client-side validations, such as separate short-password and weak-password tests. I combined those into one data-driven test and used the remaining coverage for more meaningful registration and email-verification scenarios.

- One AI-generated happy-path assertion used `verifiedToast.or(welcomeHeading)` without `.first()`. After completing a real Mailinator verification, both elements existed in the DOM, causing a Playwright strict-mode failure even though verification succeeded. I found this through a headed run/HTML report and corrected the locator.

- I also overrode several framework decisions Cursor initially suggested: nested `describe` blocks, `test.describe.parallel`, per-flow timeout constants, an unnecessary suite tag, and a separate file just for loading signup defaults. I simplified these to keep the framework maintainable and appropriate for the assignment.

- I used AI as an implementation assistant, but treated the actual application behavior as the source of truth. When a suggested test or behavior wasn't confirmed through Playwright MCP or actual execution, I changed or removed it rather than relying on the AI's assumption.
