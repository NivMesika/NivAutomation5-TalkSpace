/*
Pages is the aggregator - the fixture injects it so tests call pages.signup, pages.emailVerification... without constructing POMs manually in the spec
*/

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

    constructor(page: Page, testInfo: TestInfo, browser: Browser) { // Same browser tab + test info for all of them; browser is for Mailinator's second context
        this.navigation = new Navigation(page, testInfo); // Create each POM once when Pages is built
        this.signup = new SignupPage(page, testInfo);
        this.emailVerification = new EmailVerificationPage(page, testInfo);
        this.mailinator = new MailinatorInbox(page, testInfo, browser); // needs Browser so it can open Mailinator without stealing the Talkspace tab
    }
}
// Pages is a bag of POMs - construct them once, share the same page, expose them as pages
