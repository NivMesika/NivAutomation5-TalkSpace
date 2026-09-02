import { expect, Locator, Page, Response, test, TestInfo } from '@playwright/test';
import { General } from './general';
import { Messages } from '../constants/messages';
import { REGISTRATION_URL_MATCH, SIGNUP_PATH } from '../constants/app';
import type { SignupFormInput, TestUser } from '../utils/types';

export class SignupPage extends General {
    private readonly createAccountHeading: Locator;
    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly nicknameInput: Locator;
    private readonly countryInput: Locator;
    private readonly stateInput: Locator;
    private readonly createAccountButton: Locator;
    private readonly emailError: Locator;
    private readonly passwordRequiredError: Locator;
    private readonly passwordTooShortError: Locator;
    private readonly passwordTooWeakError: Locator;
    private readonly passwordTooWeakEnhancedError: Locator;
    private readonly nicknameRequiredError: Locator;
    private readonly nicknameSpecialCharactersError: Locator;
    private readonly stateError: Locator;
    private readonly duplicateAccountError: Locator;
    private readonly generalRegistrationError: Locator;

    constructor(page: Page, testInfo: TestInfo) {
        super(page, testInfo); // Calls the constructor of the General class
        this.createAccountHeading = page.getByRole('heading', { name: 'Create your account' });
        this.emailInput = page.getByRole('textbox', { name: 'Email' });
        this.passwordInput = page.getByRole('textbox', { name: 'Password' });
        this.nicknameInput = page.getByRole('textbox', { name: 'Nickname' });
        this.countryInput = page.getByRole('textbox', { name: 'Country' });
        this.stateInput = page.getByRole('textbox', { name: /^State/ });
        this.createAccountButton = page.getByRole('button', { name: 'Create account' });
        this.emailError = page.getByText(Messages.emailRequired, { exact: true });
        this.passwordRequiredError = page.getByText(Messages.passwordRequired, { exact: true });
        this.passwordTooShortError = page.getByText(Messages.passwordTooShort, { exact: true });
        this.passwordTooWeakError = page.getByText(Messages.passwordTooWeak, { exact: true });
        this.passwordTooWeakEnhancedError = page.getByText(Messages.passwordTooWeakEnhanced);
        this.nicknameRequiredError = page.getByText(Messages.nicknameRequired, { exact: true });
        this.nicknameSpecialCharactersError = page.getByText(Messages.nicknameSpecialCharacters, {
            exact: true,
        });
        this.stateError = page.getByText(Messages.stateRequired, { exact: true });
        this.duplicateAccountError = page.getByText(Messages.duplicateAccount);
        this.generalRegistrationError = page.getByText(Messages.generalRegistrationError);
    }

    private optionByName(name: string): Locator {
        return this.page.getByText(name, { exact: true });
    }

    async fillEmail(email: string): Promise<void> {
        await this.emailInput.fill(email);
        this.logger.debug(`Filled email: ${email}`);
    }

    async fillPassword(password: string): Promise<void> {
        await this.passwordInput.fill(password);
        this.logger.debug('Filled password');
    }

    async fillNickname(nickname: string): Promise<void> {
        await this.nicknameInput.fill(nickname);
        this.logger.debug(`Filled nickname: ${nickname}`);
    }

    async selectCountry(country: string): Promise<void> {
        await this.countryInput.click();
        const option = this.optionByName(country);
        await expect(option, `Country option ${country} should be visible in the dropdown`).toBeVisible();
        await option.click();
        this.logger.info(`Selected country: ${country}`);
    }

    async selectState(state: string): Promise<void> {
        await expect(this.stateInput, 'State field should be visible for US residents').toBeVisible();
        await this.stateInput.click();
        await this.optionByName(state).click();
        this.logger.info(`Selected state: ${state}`);
    }

    async fillForm(input: SignupFormInput): Promise<void> { // only fills fields the caller passed — negative tests omit the rest
        if (input.email) {
            await this.fillEmail(input.email);
        }
        if (input.password) {
            await this.fillPassword(input.password);
        }
        if (input.nickname) {
            await this.fillNickname(input.nickname);
        }
        if (input.country) {
            await this.selectCountry(input.country);
        }
        if (input.state) {
            await this.selectState(input.state);
        }
    }

    async submit(): Promise<void> {
        await this.createAccountButton.click();
        this.logger.info('Clicked Create account');
    }

    async submitAndWaitForRegistration(): Promise<Response> { // start waiting BEFORE the click so we don't miss the POST
        const responsePromise = this.page.waitForResponse(
            (response) =>
                response.url().includes(REGISTRATION_URL_MATCH) &&
                response.request().method() === 'POST',
        );
        await this.submit();
        return responsePromise;
    }

    flows = {
        register: async (user: TestUser) => { // happy path: unique user → 201 → email verification
            return test.step('Register a new Talkspace account', async () => {
                await this.fillForm({
                    email: user.email,
                    password: user.password,
                    nickname: user.nickname,
                    state: user.state, // Country defaults to United States, so State is required
                });
                const response = await this.submitAndWaitForRegistration();
                expect(response.status(), 'Registration API should return 201').toBe(201);
                this.logger.info(`Registered ${user.email}`);
            });
        },
        submitWith: async (input: SignupFormInput) => { // negative cases: fill whatever was passed and submit, no API wait
            return test.step('Fill signup form and submit', async () => {
                await this.fillForm(input);
                await this.submit();
            });
        },
        submitDuplicate: async (user: TestUser) => { // TS-07: same email again — should stay on verification, not enter the app
            return test.step('Submit signup with an existing email', async () => {
                await this.fillForm({
                    email: user.email,
                    password: user.password,
                    nickname: user.nickname,
                    state: user.state,
                });
                await this.submitAndWaitForRegistration();
                this.logger.info(`Submitted signup again for existing email ${user.email}`);
            });
        },
    };

    validation = {
        requiredFieldErrors: async () => {
            await expect(this.emailError, 'Empty email should show a required error').toBeVisible();
            await expect(
                this.passwordRequiredError,
                'Empty password should show a required error',
            ).toBeVisible();
            await expect(
                this.nicknameRequiredError,
                'Empty nickname should show a required error',
            ).toBeVisible();
            await expect(this.stateError, 'Empty US state should show a required error').toBeVisible();
        },
        emailError: async () => {
            await expect(this.emailError, 'Invalid email should show an email error').toBeVisible();
        },
        passwordTooShort: async () => {
            await expect(
                this.passwordTooShortError,
                'Password shorter than 8 characters should show a length error',
            ).toBeVisible();
        },
        passwordTooWeak: async () => {
            await expect(
                this.passwordTooWeakError.or(this.passwordTooWeakEnhancedError), // canary A/B: either copy is a pass
                'Weak password should be rejected even when it meets the length minimum',
            ).toBeVisible();
        },
        nicknameSpecialCharacters: async () => {
            await expect(
                this.nicknameSpecialCharactersError,
                'Nickname with spaces or symbols should show a charset error',
            ).toBeVisible();
        },
        stateHidden: async () => {
            await expect(
                this.stateInput,
                'State should be hidden when the selected country is not the United States',
            ).toBeHidden();
        },
        stateErrorAbsent: async () => {
            await expect(
                this.stateError,
                'Non-US signup should not require a state',
            ).toBeHidden();
        },
        stillOnSignup: async () => {
            await expect(
                this.createAccountHeading,
                'User should remain on the Create account form',
            ).toBeVisible();
            expect(this.page.url(), 'URL should still be the signup path').toContain(SIGNUP_PATH);
            this.logger.success('Still on the signup form');
        },
        duplicateAccount: async () => {
            await expect(
                this.duplicateAccountError.or(this.generalRegistrationError),
                'Reusing an existing email should show a duplicate or registration error',
            ).toBeVisible();
        },
    };
}
