/*
General is the base page object — it owns the Playwright page, testInfo, logger and cookieAcceptButton - all feature pages extend it.
*/

// General is DRY for POMs — without it, every page object reimplements page/testInfo/logger/cookieAcceptButton
import { Locator, Page, TestInfo } from '@playwright/test';
import { Logger } from '../utils/logger';

export class General { // Base class for feature page objects in this suite
    public readonly page: Page;
    public readonly testInfo: TestInfo;
    public readonly logger: Logger;
    private readonly cookieAcceptButton: Locator;

    constructor(page: Page, testInfo: TestInfo) { // Initializes the page, testInfo, logger and cookieAcceptButton
        this.page = page;
        this.testInfo = testInfo;
        this.logger = new Logger(this.constructor.name); // The name of the class is used as the logger name
        this.cookieAcceptButton = page.getByRole('button', { name: /accept|agree|got it/i });
    }

    async dismissCookieBannerIfPresent(): Promise<void> {
        const isVisible = await this.cookieAcceptButton.first().isVisible().catch(() => false); // if an Accept/Agree button appears, click it. If not, continue

        if (isVisible) {
            await this.cookieAcceptButton.first().click();
            this.logger.debug('Dismissed cookie consent banner');
        }
    }
}
