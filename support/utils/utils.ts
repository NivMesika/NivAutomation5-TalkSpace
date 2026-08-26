import type { SignupDefaults } from './types';

export function generateRandomString(length = 10): string {
    return Math.random().toString(36).slice(2).padEnd(length, '0').slice(0, length);
}

export function generateRandomLetters(length = 8): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

export function generateUniqueEmail(prefix = 'qa.ts', domain = 'mailinator.com'): string {
    return `${prefix}.${Date.now()}.${generateRandomString(6)}@${domain}`;
}

export function generateUniqueNickname(): string {
    return `Qa${generateRandomLetters(6)}`;
}

export function generateStrongPassword(): string {
    return `TsQa-${generateRandomLetters(6)}-2026!`;
}

export function mailinatorLocalPart(email: string): string {
    return email.split('@')[0] ?? email;
}

export function isSignupDefaults(value: unknown): value is SignupDefaults {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const record = value as Record<string, unknown>;
    const required: Array<keyof SignupDefaults> = [
        'country',
        'state',
        'nonUsCountry',
        'mailDomain',
        'invalidEmail',
        'shortPassword',
        'weakPassword',
        'invalidNickname',
        'invalidOtp',
    ];

    return required.every((key) => typeof record[key] === 'string' && record[key]);
}
