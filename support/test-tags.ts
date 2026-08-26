export const Priority = {
    Urgent: '@urgent',
    High: '@high',
    Medium: '@medium',
    Low: '@low',
} as const;

export type TestPriority = (typeof Priority)[keyof typeof Priority];
