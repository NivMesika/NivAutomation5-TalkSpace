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

function loadSignupDefaults(
    filePath = process.env.SIGNUP_DEFAULTS_FILE ?? DEFAULT_SIGNUP_DEFAULTS_FILE,
): SignupDefaults {
    const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Signup defaults file not found: ${resolvedPath}`);
    }

    const parsed: unknown = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));

    if (!isSignupDefaults(parsed)) {
        throw new Error(`Invalid signup defaults in ${resolvedPath}`);
    }

    return parsed;
}

export const test = base.extend<{
    pages: Pages;
    testUser: TestUser;
    signupDefaults: SignupDefaults;
}>({
    signupDefaults: async ({}, use) => {
        await use(loadSignupDefaults());
    },
    testUser: async ({ signupDefaults }, use) => {
        await use({
            email: generateUniqueEmail('qa.ts', signupDefaults.mailDomain),
            nickname: generateUniqueNickname(),
            password: generateStrongPassword(),
            country: signupDefaults.country,
            state: signupDefaults.state,
        });
    },
    pages: async ({ page, browser }, use, testInfo) => {
        await use(new Pages(page, testInfo, browser));
    },
});

export { expect } from '@playwright/test';
