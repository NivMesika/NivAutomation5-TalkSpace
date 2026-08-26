import { expect, Locator, Page, test, TestInfo } from '@playwright/test';
import { General } from '../general';
import { SIGNUP_PATH } from '../../constants/app';

export class Navigation extends General {
    private readonly createAccountHeading: Locator;

    constructor(page: Page, testInfo: TestInfo) {
        super(page, testInfo);
        this.createAccountHeading = page.getByRole('heading', { name: 'Create your account' });
    }

    async gotoSignup(): Promise<void> {
        return test.step('Navigate to Talkspace signup', async () => {
            await this.page.goto(SIGNUP_PATH, { waitUntil: 'domcontentloaded' });
            await this.dismissCookieBannerIfPresent();
            await expect(
                this.createAccountHeading,
                'Create your account heading should be visible after opening signup',
            ).toBeVisible();
            this.logger.info(`Opened signup at ${this.page.url()}`);
        });
    }
}
