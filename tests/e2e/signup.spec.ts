import { test } from '../../support/test-base';
import { Priority } from '../../support/test-tags';

test.describe('Talkspace signup — autoswitchpt', () => {
    test(
        'TS-01: Should block submit when required fields are empty',
        { tag: Priority.High },
        async ({ pages }) => {
            await pages.navigation.gotoSignup(); // Opens /signup/autoswitchpt
            await pages.signup.submit(); // Click Create account with nothing filled
            await pages.signup.validation.requiredFieldErrors(); // email / password / nickname / state required copy
            await pages.signup.validation.stillOnSignup(); // still on the Create account form
        },
    );

    test(
        'TS-02: Should reject an invalid email format',
        { tag: Priority.High },
        async ({ pages, testUser, signupDefaults }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.submitWith({
                email: signupDefaults.invalidEmail, // "user@localhost"
                password: testUser.password,
                nickname: testUser.nickname,
                state: testUser.state,
            });
            await pages.signup.validation.emailError(); // "Please enter an email."
            await pages.signup.validation.stillOnSignup();
        },
    );

    test(
        'TS-03: Should reject passwords that do not meet security requirements',
        { tag: Priority.High },
        async ({ pages, testUser, signupDefaults }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.submitWith({
                email: testUser.email,
                password: signupDefaults.shortPassword, // "Abcdef1" — 7 chars
                nickname: testUser.nickname,
                state: testUser.state,
            });
            await pages.signup.validation.passwordTooShort(); // "Password must be at least 8 characters."
            await pages.signup.validation.stillOnSignup();

            await pages.navigation.gotoSignup(); // reset the form, then try a long-but-weak password
            await pages.signup.flows.submitWith({
                email: testUser.email,
                password: signupDefaults.weakPassword, // "abcdefgh" — 8 letters, no strength
                nickname: testUser.nickname,
                state: testUser.state,
            });
            await pages.signup.validation.passwordTooWeak(); // "Please select a stronger password." or the enhanced copy
            await pages.signup.validation.stillOnSignup();
        },
    );

    test(
        'TS-04: Should reject a nickname that contains special characters',
        { tag: Priority.High },
        async ({ pages, testUser, signupDefaults }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.submitWith({
                email: testUser.email,
                password: testUser.password,
                nickname: signupDefaults.invalidNickname, // "Qa user!"
                state: testUser.state,
            });
            await pages.signup.validation.nicknameSpecialCharacters(); // "Can't contain special characters or spaces."
            await pages.signup.validation.stillOnSignup();
        },
    );

    test(
        'TS-05: Should hide State when a non-US country is selected',
        { tag: Priority.High },
        async ({ pages, signupDefaults }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.selectCountry(signupDefaults.nonUsCountry); // "Canada"
            await pages.signup.validation.stateHidden(); // State field is gone
            await pages.signup.submit();
            await pages.signup.validation.stateErrorAbsent(); // no "Please select a state."
        },
    );

    test(
        'TS-06: Should register a US user and reach email verification',
        { tag: Priority.High },
        async ({ pages, testUser }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.register(testUser); // unique Mailinator email → POST /v2/registration 201
            await pages.emailVerification.validation.registered(testUser.email); // lands on /email-verification
        },
    );

    test(
        'TS-07: Should keep an existing email on verification instead of entering the app',
        { tag: Priority.High },
        async ({ pages, testUser }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.register(testUser);
            await pages.emailVerification.validation.verificationScreenVisible(testUser.email);
            await pages.navigation.gotoSignup(); // same email, second submit
            await pages.signup.flows.submitDuplicate(testUser);
            await pages.emailVerification.validation.stillUnverified(testUser.email); // still unverified — not /home or /rooms
        },
    );

    test(
        'TS-08: Should reject invalid email verification',
        { tag: Priority.High },
        async ({ pages, testUser, signupDefaults }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.register(testUser);
            await pages.emailVerification.validation.verificationScreenVisible(testUser.email);
            await pages.emailVerification.flows.submitInvalidVerification(signupDefaults.invalidOtp); // "000000" or a bad hash, depending on A/B
            await pages.emailVerification.validation.invalidVerification(); // error copy, still on verification
        },
    );

    test(
        'TS-09: Should resend the email verification',
        { tag: Priority.High },
        async ({ pages, testUser }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.register(testUser);
            await pages.emailVerification.validation.verificationScreenVisible(testUser.email);
            await pages.emailVerification.flows.resendVerification(); // Resend code (OTP) or Resend email (link)
            await pages.emailVerification.validation.verificationResent(testUser.email); // still on verification after resend
        },
    );

    test(
        'TS-10: Should verify email using the message sent to the inbox',
        { tag: Priority.High },
        async ({ pages, testUser }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.register(testUser);
            await pages.emailVerification.validation.verificationScreenVisible(testUser.email);
            const payload = await pages.mailinator.flows.readVerification(testUser.email); // opens Mailinator in a second browser context
            await pages.emailVerification.flows.completeVerification(payload); // OTP digits or the verify-email link
            await pages.emailVerification.validation.emailVerified(); // toast / welcome, or /meet-your-provider; plus /home or /room/
        },
    );
});
