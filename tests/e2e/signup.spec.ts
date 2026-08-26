import { test } from '../../support/test-base';
import { Priority } from '../../support/test-tags';

test.describe('Talkspace signup — autoswitchpt', () => {
    test(
        'TS-01: Should block submit when required fields are empty',
        { tag: Priority.High },
        async ({ pages }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.submit();
            await pages.signup.validation.requiredFieldErrors();
            await pages.signup.validation.stillOnSignup();
        },
    );

    test(
        'TS-02: Should reject an invalid email format',
        { tag: Priority.High },
        async ({ pages, testUser, signupDefaults }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.submitWith({
                email: signupDefaults.invalidEmail,
                password: testUser.password,
                nickname: testUser.nickname,
                state: testUser.state,
            });
            await pages.signup.validation.emailError();
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
                password: signupDefaults.shortPassword,
                nickname: testUser.nickname,
                state: testUser.state,
            });
            await pages.signup.validation.passwordTooShort();
            await pages.signup.validation.stillOnSignup();

            await pages.navigation.gotoSignup();
            await pages.signup.flows.submitWith({
                email: testUser.email,
                password: signupDefaults.weakPassword,
                nickname: testUser.nickname,
                state: testUser.state,
            });
            await pages.signup.validation.passwordTooWeak();
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
                nickname: signupDefaults.invalidNickname,
                state: testUser.state,
            });
            await pages.signup.validation.nicknameSpecialCharacters();
            await pages.signup.validation.stillOnSignup();
        },
    );

    test(
        'TS-05: Should hide State when a non-US country is selected',
        { tag: Priority.High },
        async ({ pages, signupDefaults }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.selectCountry(signupDefaults.nonUsCountry);
            await pages.signup.validation.stateHidden();
            await pages.signup.submit();
            await pages.signup.validation.stateErrorAbsent();
        },
    );

    test(
        'TS-06: Should register a US user and reach email verification',
        { tag: Priority.High },
        async ({ pages, testUser }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.register(testUser);
            await pages.emailVerification.validation.registered(testUser.email);
        },
    );

    test(
        'TS-07: Should keep an existing email on verification instead of entering the app',
        { tag: Priority.High },
        async ({ pages, testUser }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.register(testUser);
            await pages.emailVerification.validation.verificationScreenVisible(testUser.email);
            await pages.navigation.gotoSignup();
            await pages.signup.flows.submitDuplicate(testUser);
            await pages.emailVerification.validation.stillUnverified(testUser.email);
        },
    );

    test(
        'TS-08: Should reject invalid email verification',
        { tag: Priority.High },
        async ({ pages, testUser, signupDefaults }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.register(testUser);
            await pages.emailVerification.validation.verificationScreenVisible(testUser.email);
            await pages.emailVerification.flows.submitInvalidVerification(signupDefaults.invalidOtp);
            await pages.emailVerification.validation.invalidVerification();
        },
    );

    test(
        'TS-09: Should resend the email verification',
        { tag: Priority.High },
        async ({ pages, testUser }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.register(testUser);
            await pages.emailVerification.validation.verificationScreenVisible(testUser.email);
            await pages.emailVerification.flows.resendVerification();
            await pages.emailVerification.validation.verificationResent(testUser.email);
        },
    );

    test(
        'TS-10: Should verify email using the message sent to the inbox',
        { tag: Priority.High },
        async ({ pages, testUser }) => {
            await pages.navigation.gotoSignup();
            await pages.signup.flows.register(testUser);
            await pages.emailVerification.validation.verificationScreenVisible(testUser.email);
            const payload = await pages.mailinator.flows.readVerification(testUser.email);
            await pages.emailVerification.flows.completeVerification(payload);
            await pages.emailVerification.validation.emailVerified();
        },
    );
});
