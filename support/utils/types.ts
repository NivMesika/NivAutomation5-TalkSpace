export type TestUser = {
    email: string;
    nickname: string;
    password: string;
    country: string;
    state: string;
};

export type SignupFormInput = {
    email?: string;
    password?: string;
    nickname?: string;
    country?: string;
    state?: string;
};

export type SignupDefaults = {
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
