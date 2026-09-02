/*
App constants centralize the canary base URL, signup/verification paths, API URL matches, and Mailinator so POM and tests stay DRY.
*/

export const DEFAULT_BASE_URL = 'https://app.canary.talkspace.com'; // used when BASE_URL is not set in .env
export const SIGNUP_PATH = '/signup/autoswitchpt'; // Playwright resolves this against baseURL
export const VERIFICATION_PATH = '/email-verification';
export const MEET_YOUR_PROVIDER_PATH = 'meet-your-provider'; // post-verify onboarding: /room/:id/onboarding/meet-your-provider
export const LOGGED_IN_URL = /\/home|\/room\/|meet-your-provider/; // verified users land in the app, not back on signup
export const MAILINATOR_INBOX_URL = 'https://www.mailinator.com/v4/public/inboxes.jsp';
export const REGISTRATION_URL_MATCH = '/v2/registration'; // POST that TS-06 waits for (expect 201)
export const EMAIL_VERIFICATION_URL_MATCH = '/v2/auth/email-verification';
export const OTP_VERIFY_URL_MATCH = '/v2/auth/email-verification/otp';
export const OTP_RESEND_URL_MATCH = '/v2/auth/email-verification/otp/resend';
export const INVALID_VERIFICATION_HASH = 'email-verification#verificationCode=invalid-token'; // used when canary shows the link variant, not OTP
