/*
Asserted UI copy lives here so locators stay DRY — if Talkspace changes a string, update it once.
*/

export const Messages = {
    emailRequired: 'Please enter an email.',
    passwordRequired: 'Please enter a password.',
    nicknameRequired: 'Please enter a nickname.',
    stateRequired: 'Please select a state.',
    passwordTooShort: 'Password must be at least 8 characters.',
    passwordTooWeak: 'Please select a stronger password.',
    passwordTooWeakEnhanced:
        "Password not secure enough. Try adding symbols or words, and don't use repeat characters.", // canary A/B: either this or passwordTooWeak
    nicknameSpecialCharacters: "Can't contain special characters or spaces.",
    otpTitle: 'Before matching with a provider, verify your email',
    verificationLinkCopy: 'We sent an email with a verification link to',
    otpCodeCopy: 'We sent a one-time code to',
    resendEmail: 'Resend email',
    emailResent: 'Email resent',
    resendCode: 'Resend code',
    otpError: 'Error validating OTP',
    verificationLinkExpired: 'Your verification link has expired',
    emailVerified: 'Your email has been verified',
    welcomeNoName: 'Welcome to Talkspace!',
    duplicateAccount:
        "We couldn't complete your signup. If you already have an account, look for an activation or login email in your inbox.",
    generalRegistrationError:
        'Oops, we encountered an error. Double check all your information and try again.',
    verificationEmailSubject: 'Verify your email address', // Mailinator row match
} as const;
