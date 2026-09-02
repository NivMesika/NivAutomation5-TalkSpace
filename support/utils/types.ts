/*
Types.ts contains the TypeScript types for the project - TestUser is generated per run, SignupDefaults comes from JSON, SignupFormInput is the optional fill shape for negative cases.
*/

export type TestUser = { // unique identity injected by the testUser fixture
    email: string;
    nickname: string;
    password: string;
    country: string;
    state: string;
};

export type SignupFormInput = { // every field optional so negative tests can omit / override one value
    email?: string;
    password?: string;
    nickname?: string;
    country?: string;
    state?: string;
};

export type SignupDefaults = { // shape of support/data/signup-defaults.json
    country: string;
    state: string;
    nonUsCountry: string;
    mailDomain: string;
    invalidEmail: string;
    shortPassword: string;
    weakPassword: string;
    invalidNickname: string;
    invalidOtp: string;
};
