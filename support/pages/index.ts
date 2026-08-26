import { Browser, Page, TestInfo } from '@playwright/test';
import { Navigation } from './infra/navigation';
import { SignupPage } from './signup';
import { EmailVerificationPage } from './email-verification';
import { MailinatorInbox } from './mailinator';

export class Pages {
    public readonly navigation: Navigation;
    public readonly signup: SignupPage;
    public readonly emailVerification: EmailVerificationPage;
    public readonly mailinator: MailinatorInbox;

    constructor(page: Page, testInfo: TestInfo, browser: Browser) {
        this.navigation = new Navigation(page, testInfo);
        this.signup = new SignupPage(page, testInfo);
        this.emailVerification = new EmailVerificationPage(page, testInfo);
        this.mailinator = new MailinatorInbox(page, testInfo, browser);
    }
}
