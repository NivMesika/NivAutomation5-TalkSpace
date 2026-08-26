import { expect, Locator, Page, test, TestInfo } from '@playwright/test';
import { General } from './general';
import { Messages } from '../constants/messages';
import {
    EMAIL_VERIFICATION_URL_MATCH,
    INVALID_VERIFICATION_HASH,
    LOGGED_IN_URL,
    OTP_RESEND_URL_MATCH,
    OTP_VERIFY_URL_MATCH,
    VERIFICATION_PATH,
} from '../constants/app';

export class EmailVerificationPage extends General {
    private readonly verificationTitle: Locator;
    private readonly otpInputOne: Locator;
    private readonly otpInputs: Locator;
    private readonly otpError: Locator;
    private readonly expiredLinkMessage: Locator;
    private readonly resendEmailButton: Locator;
    private readonly emailResentButton: Locator;
    private readonly resendCodeButton: Locator;
    private readonly verifiedToast: Locator;
    private readonly welcomeHeading: Locator;

    constructor(page: Page, testInfo: TestInfo) {
        super(page, testInfo);
        this.verificationTitle = page.getByText(Messages.otpTitle);
        this.otpInputOne = page.getByRole('textbox', { name: 'Input verification code 1' });
        this.otpInputs = page.getByRole('textbox', { name: /Input verification code \d/ });
        this.otpError = page.getByText(Messages.otpError, { exact: true });
        this.expiredLinkMessage = page.getByText(Messages.verificationLinkExpired);
        this.resendEmailButton = page.getByRole('button', { name: Messages.resendEmail });
        this.emailResentButton = page.getByRole('button', { name: Messages.emailResent });
        this.resendCodeButton = page.getByRole('button', { name: Messages.resendCode });
        this.verifiedToast = page.getByText(Messages.emailVerified);
        this.welcomeHeading = page.getByText(Messages.welcomeNoName);
    }

    async isOtpMode(): Promise<boolean> {
        return this.otpInputOne.isVisible().catch(() => false);
    }


    async enterOtp(code: string): Promise<void> {
        await expect(this.otpInputOne, 'First OTP input should be ready').toBeVisible();
        await this.otpInputOne.fill(code);
        this.logger.info('Entered email verification code');
    }

    flows = {
        enterInvalidOtp: async (code: string) => {
            return test.step('Submit an invalid verification code', async () => {
                const responsePromise = this.page.waitForResponse(
                    (response) =>
                        response.url().includes(OTP_VERIFY_URL_MATCH) &&
                        !response.url().includes('/resend') &&
                        response.request().method() === 'POST',
                );
                await this.enterOtp(code);
                const response = await responsePromise;
                expect(response.status(), 'Invalid OTP should be rejected by the API').toBe(401);
                this.logger.info('Invalid OTP request returned 401');
            });
        },
        enterValidOtp: async (code: string) => {
            return test.step('Submit the verification code from email', async () => {
                await this.enterOtp(code);
            });
        },
        openInvalidVerificationLink: async () => {
            return test.step('Open an invalid email verification link', async () => {
                await this.page.goto(`/${INVALID_VERIFICATION_HASH}`, {
                    waitUntil: 'domcontentloaded',
                });
                this.logger.info('Opened invalid verification hash');
            });
        },
        openVerificationLink: async (url: string) => {
            return test.step('Open the verification link from email', async () => {
                await this.page.goto(url, { waitUntil: 'domcontentloaded' });
                this.logger.info('Opened verification link from inbox');
            });
        },
        submitInvalidVerification: async (invalidOtp: string) => {
            return test.step('Submit invalid email verification', async () => {
                if (await this.isOtpMode()) {
                    await this.flows.enterInvalidOtp(invalidOtp);
                    return;
                }
                await this.flows.openInvalidVerificationLink();
            });
        },
        resendVerification: async () => {
            return test.step('Resend the email verification', async () => {
                if (await this.isOtpMode()) {
                    await expect(
                        this.resendCodeButton,
                        'Resend code should be available on the OTP screen',
                    ).toBeVisible();
                    const responsePromise = this.page.waitForResponse(
                        (response) =>
                            response.url().includes(OTP_RESEND_URL_MATCH) &&
                            response.request().method() === 'POST',
                    );
                    await this.resendCodeButton.click();
                    const response = await responsePromise;
                    expect(response.status(), 'OTP resend should succeed').toBe(200);
                    const body = (await response.json().catch(() => null)) as {
                        data?: { otpToken?: string };
                        otpToken?: string;
                    } | null;
                    const otpToken = body?.data?.otpToken ?? body?.otpToken;
                    expect(otpToken, 'OTP resend response should include a new otpToken').toBeTruthy();
                    this.logger.info('OTP resend returned 200 with a new otpToken');
                    return;
                }

                await expect(
                    this.resendEmailButton,
                    'Resend email should be available on the link verification screen',
                ).toBeVisible();
                const responsePromise = this.page.waitForResponse(
                    (response) =>
                        response.url().includes(EMAIL_VERIFICATION_URL_MATCH) &&
                        !response.url().includes('/otp') &&
                        response.request().method() === 'POST',
                );
                await this.resendEmailButton.click();
                const response = await responsePromise;
                expect(
                    [200, 204],
                    'Verification email resend should succeed',
                ).toContain(response.status());
                this.logger.info(`Verification email resend returned ${response.status()}`);
            });
        },
        completeVerification: async (payload: { code?: string; link?: string }) => {
            return test.step('Complete email verification from inbox', async () => {
                if (payload.code && (await this.isOtpMode())) {
                    await this.flows.enterValidOtp(payload.code);
                    return;
                }
                expect(payload.link, 'Verification email should include a verify-email link').toBeTruthy();
                await this.flows.openVerificationLink(payload.link!);
            });
        },
    };

    validation = {
        verificationScreenVisible: async (email: string) => {
            await expect(
                this.page,
                'Should navigate to email verification after registration',
            ).toHaveURL(new RegExp(VERIFICATION_PATH));
            await expect(
                this.verificationTitle,
                'Verification heading copy should be visible',
            ).toBeVisible();
            await expect(
                this.page.getByText(email),
                'Verification page should show the registered email',
            ).toBeVisible();
        },
        registered: async (email: string) => {
            await this.validation.verificationScreenVisible(email);
            this.logger.success('Email verification screen is displayed');
        },
        invalidVerification: async () => {
            if (await this.isOtpMode()) {
                await expect(this.otpError, 'Invalid OTP should show an error').toBeVisible();
                await expect(
                    this.page,
                    'User should remain on the OTP page after a bad code',
                ).toHaveURL(new RegExp(`${VERIFICATION_PATH}/otp`));
                this.logger.success('Invalid OTP error is displayed');
                return;
            }

            await expect(
                this.otpError.or(this.expiredLinkMessage).or(this.resendEmailButton),
                'An invalid verification link should show an error or keep the user on verification',
            ).toBeVisible();
            await expect(
                this.page,
                'Invalid verification should not enter the logged-in app',
            ).toHaveURL(new RegExp(VERIFICATION_PATH));
            this.logger.success('Invalid verification link did not admit the user');
        },
        emailVerified: async () => {
            await expect(
                this.verifiedToast.or(this.welcomeHeading).first(),
                'Verified users should see a success toast or the Talkspace welcome screen',
            ).toBeVisible();
            await expect(
                this.page,
                'Verified users should land in the logged-in app',
            ).toHaveURL(LOGGED_IN_URL);
            this.logger.success('Email verification succeeded');
        },
        stillUnverified: async (email: string) => {
            await this.validation.verificationScreenVisible(email);
            await expect(
                this.page,
                'Existing email should not skip verification into the app',
            ).not.toHaveURL(/\/rooms|\/home/);
            this.logger.success('Existing email is still on email verification');
        },
        verificationResent: async (email: string) => {
            await this.validation.verificationScreenVisible(email);
            if (await this.isOtpMode()) {
                await expect(
                    this.otpInputs,
                    'OTP inputs should remain available after resend',
                ).toHaveCount(6);
                await expect(
                    this.resendCodeButton,
                    'Resend code should still be available after a successful resend',
                ).toBeVisible();
                this.logger.success('Verification code resend kept the user on the OTP screen');
                return;
            }

            await expect(
                this.emailResentButton,
                'Link verification should show Email resent after a successful resend',
            ).toBeVisible();
            this.logger.success('Verification email resend kept the user on the link screen');
        },
    };
}
