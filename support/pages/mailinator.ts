import { Browser, expect, Locator, Page, test, TestInfo } from '@playwright/test';
import { General } from './general';
import { MAILINATOR_INBOX_URL } from '../constants/app';
import { Messages } from '../constants/messages';
import { mailinatorLocalPart } from '../utils/utils';

export type InboxVerification = {
    code?: string; // 6-digit OTP from the TEXT/HTML tab
    link?: string; // verify-email URL from the LINKS tab
};

export class MailinatorInbox extends General {
    private readonly browser: Browser;
    private readonly inboxField: Locator;
    private readonly goButton: Locator;
    private readonly verificationRow: Locator;
    private readonly htmlTab: Locator;
    private readonly textTab: Locator;
    private readonly linksTab: Locator;
    private readonly htmlPanel: Locator;
    private readonly textPanel: Locator;
    private readonly linksPanel: Locator;

    constructor(page: Page, testInfo: TestInfo, browser: Browser) {
        super(page, testInfo); // Calls the constructor of the General class
        this.browser = browser; // used to open a second context so Mailinator doesn't steal the Talkspace tab
        this.inboxField = page.getByRole('textbox', { name: 'inbox field' });
        this.goButton = page.getByRole('button', { name: 'GO' });
        this.verificationRow = page.getByRole('row', {
            name: new RegExp(`Talkspace\\s+${Messages.verificationEmailSubject}`),
        });
        this.htmlTab = page.getByRole('tab', { name: 'HTML' });
        this.textTab = page.getByRole('tab', { name: 'TEXT' });
        this.linksTab = page.getByRole('tab', { name: 'LINKS' });
        this.htmlPanel = page.getByRole('tabpanel', { name: 'HTML' });
        this.textPanel = page.getByRole('tabpanel', { name: 'TEXT' });
        this.linksPanel = page.getByRole('tabpanel', { name: 'LINKS' });
    }

    flows = {
        readVerification: async (email: string) => {
            return test.step(`Read verification email for ${email}`, async () => {
                const context = await this.browser.newContext(); // isolated session — Talkspace cookies stay on the original page
                const inboxPage = await context.newPage();
                const inbox = new MailinatorInbox(inboxPage, this.testInfo, this.browser);

                try {
                    const payload = await inbox.openLatestVerification(email);
                    this.logger.info(`Retrieved verification payload for ${email}`);
                    return payload;
                } finally {
                    await context.close(); // always close so we don't leak browsers if the email never arrives
                }
            });
        },
    };

    private async openLatestVerification(email: string): Promise<InboxVerification> {
        const localPart = mailinatorLocalPart(email); // qa.ts.1712345678901.ab12cd — Mailinator inbox is the part before @
        await this.page.goto(`${MAILINATOR_INBOX_URL}?to=${encodeURIComponent(localPart)}`, {
            waitUntil: 'domcontentloaded',
        });
        await this.dismissCookieBannerIfPresent();

        if (await this.inboxField.isVisible().catch(() => false)) { // public inbox sometimes still asks for the name
            await this.inboxField.fill(localPart);
            await this.goButton.click();
        }

        await expect(
            this.verificationRow.first(),
            'Talkspace verification email should arrive in Mailinator',
        ).toBeVisible({ timeout: 90_000 }); // email delivery is the one wait that genuinely needs more than Playwright defaults
        await this.verificationRow.first().click();

        const code = await this.readCodeFromEmail();
        const link = await this.readLinkFromEmail();

        expect(
            code || link,
            'Verification email should contain a 6-digit code or a verify-email link',
        ).toBeTruthy();

        return { code, link };
    }

    private async readCodeFromEmail(): Promise<string | undefined> {
        if (await this.textTab.isVisible().catch(() => false)) {
            await this.textTab.click();
            const text = (await this.textPanel.innerText().catch(() => '')) ?? '';
            const match = text.match(/\b(\d{6})\b/);
            if (match?.[1]) {
                return match[1];
            }
        }

        if (await this.htmlTab.isVisible().catch(() => false)) {
            await this.htmlTab.click();
        }

        const frame = this.htmlPanel.locator('iframe').first().contentFrame(); // HTML body is inside Mailinator's preview iframe
        const codeLocator = frame.getByText(/\b\d{6}\b/);

        try {
            await expect(codeLocator.first()).toBeVisible();
            const raw = ((await codeLocator.first().textContent()) ?? '').trim();
            return raw.match(/\d{6}/)?.[0];
        } catch {
            return undefined; // link-variant emails have no 6-digit code — that's fine
        }
    }

    private async readLinkFromEmail(): Promise<string | undefined> {
        if (!(await this.linksTab.isVisible().catch(() => false))) {
            return undefined;
        }

        await this.linksTab.click();
        const verifyLink = this.linksPanel.getByRole('link', { name: /email-verification/i }).first();
        if (await verifyLink.isVisible().catch(() => false)) {
            return (await verifyLink.getAttribute('href')) ?? undefined;
        }

        const href = await this.linksPanel
            .locator('a[href*="email-verification"]') // CSS fallback if the accessible name doesn't include email-verification
            .first()
            .getAttribute('href')
            .catch(() => null);

        return href ?? undefined;
    }
}
