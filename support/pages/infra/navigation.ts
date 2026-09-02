/*
Navigation owns URL entry points so specs call pages.navigation.gotoSignup() instead of page.goto('/signup/...')
*/

import { expect, Locator, Page, test, TestInfo } from '@playwright/test';
import { General } from '../general';
import { SIGNUP_PATH } from '../../constants/app';

export class Navigation extends General { // extends General, so it gets this.page, this.testInfo, and this.logger for free.
    private readonly createAccountHeading: Locator;

    constructor(page: Page, testInfo: TestInfo) {
        super(page, testInfo); // Calls the constructor of the General class
        this.createAccountHeading = page.getByRole('heading', { name: 'Create your account' });
    }

    async gotoSignup(): Promise<void> {
        return test.step('Navigate to Talkspace signup', async () => {
            await this.page.goto(SIGNUP_PATH, { waitUntil: 'domcontentloaded' }); // Playwright resolves /signup/autoswitchpt against baseURL
            await this.dismissCookieBannerIfPresent(); // if an Accept/Agree button appears, click it. If not, continue
            await expect(
                this.createAccountHeading,
                'Create your account heading should be visible after opening signup',
            ).toBeVisible();
            this.logger.info(`Opened signup at ${this.page.url()}`);
        });
    }
}
