/*
test-base extends Playwright with fixtures:
signupDefaults loads JSON samples, testUser generates isolated run data, pages wires the POM aggregator — so the spec stays focused on steps, not setup.
*/

import fs from 'fs';
import path from 'path';
import { test as base } from '@playwright/test';
import { Pages } from './pages';
import {
    generateStrongPassword,
    generateUniqueEmail,
    generateUniqueNickname,
    isSignupDefaults,
} from './utils/utils';
import type { SignupDefaults, TestUser } from './utils/types';

const DEFAULT_SIGNUP_DEFAULTS_FILE = 'support/data/signup-defaults.json';

/*
    loadSignupDefaults - Loads test data out of the spec so "Canada" / "user@localhost" / "000000" are not hardcoded in the test.
    Playwright fixture calls this and injects signupDefaults.

    1. Pick a file — SIGNUP_DEFAULTS_FILE env var, otherwise signup-defaults.json
    2. Resolve the path — if relative, from the repo root
    3. Read + parse the JSON
    4. Fail fast if any required field is missing or not a string
*/
function loadSignupDefaults( // Reads signup-defaults.json, validates it, and returns static samples so the spec doesn’t hardcode them.
    filePath = process.env.SIGNUP_DEFAULTS_FILE ?? DEFAULT_SIGNUP_DEFAULTS_FILE, // SIGNUP_DEFAULTS_FILE env override, else default JSON
): SignupDefaults {
    const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath); // relative path → from repo root

    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Signup defaults file not found: ${resolvedPath}`);
    }

    const parsed: unknown = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8')); // parse the JSON file into an object

    if (!isSignupDefaults(parsed)) { // fail fast if country / invalidEmail / invalidOtp / … are missing or invalid
        throw new Error(`Invalid signup defaults in ${resolvedPath}`);
    }

    return parsed; // return the parsed JSON object
}

export const test = base.extend<{
    pages: Pages; // single aggregator: navigation, signup, emailVerification, mailinator
    testUser: TestUser; // unique identity per test so parallel runs don't collide
    signupDefaults: SignupDefaults; // static samples so the spec doesn’t hardcode them
}>({
    signupDefaults: async ({}, use) => {
        await use(loadSignupDefaults());
        /*
        signupDefaults is loaded from support/data/signup-defaults.json
        country = "United States" - default country on the form
        state = "New York" - US state when Country is United States
        nonUsCountry = "Canada" - hides the State field
        mailDomain = "mailinator.com" - inbox domain for unique emails
        invalidEmail = "user@localhost" - fails email format
        shortPassword = "Abcdef1" - 7 chars, fails length
        weakPassword = "abcdefgh" - 8 letters, fails strength
        invalidNickname = "Qa user!" - spaces / symbols
        invalidOtp = "000000" - rejected verification code
        */
    },
    testUser: async ({ signupDefaults }, use) => { // unique identity per test so parallel runs don't collide
        await use({
            email: generateUniqueEmail('qa.ts', signupDefaults.mailDomain), // e.g. qa.ts.1712345678901.ab12cd@mailinator.com
            nickname: generateUniqueNickname(), // e.g. Qaabcdef — letters only, no spaces
            password: generateStrongPassword(), // meets length + strength so happy-path signup succeeds
            country: signupDefaults.country, // "United States"
            state: signupDefaults.state, // "New York"
        });
    },
    pages: async ({ page, browser }, use, testInfo) => { // single aggregator: navigation, signup, emailVerification, mailinator
        await use(new Pages(page, testInfo, browser)); // browser is passed through so Mailinator can open a second context
    },
});

export { expect } from '@playwright/test';
