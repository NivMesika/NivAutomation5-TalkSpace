import { Locator, Page, TestInfo } from '@playwright/test';
import { Logger } from '../utils/logger';

export class General {
    public readonly page: Page;
    public readonly testInfo: TestInfo;
    public readonly logger: Logger;
    private readonly cookieAcceptButton: Locator;

    constructor(page: Page, testInfo: TestInfo) {
        this.page = page;
        this.testInfo = testInfo;
        this.logger = new Logger(this.constructor.name);
        this.cookieAcceptButton = page.getByRole('button', { name: /accept|agree|got it/i });
    }

    async dismissCookieBannerIfPresent(): Promise<void> {
        const isVisible = await this.cookieAcceptButton.first().isVisible().catch(() => false);

        if (isVisible) {
            await this.cookieAcceptButton.first().click();
            this.logger.debug('Dismissed cookie consent banner');
        }
    }
}
