import type { IUser, WalletData } from "../models/User.js";


export interface IUserRepo {
    createUser: (user: createDTO) => Promise<IUser>;
    createWallet: (userId: string) => Promise<void>;
    findUserByEmail: (email: string) => Promise<IUser | null>;
    findUserById: (id: string) => Promise<IUser | null>;
    findWalletByUserId: (userId: string) => Promise<WalletData | null>;
    addWalletFunds: (userId: string, amount: number) => Promise<WalletData | null>;
    addRefreshToken: (userId: string, tokenHash: string) => Promise<void>;
    hasRefreshToken: (userId: string, tokenHash: string) => Promise<boolean>;
    replaceRefreshToken: (userId: string, oldTokenHash: string, newTokenHash: string) => Promise<boolean>;
    removeRefreshToken: (userId: string, tokenHash: string) => Promise<void>;
}

export interface createDTO {
    name: string,
    email: string,
    password: string
}
