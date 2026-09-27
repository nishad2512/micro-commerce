import type { IUser } from "../models/User.js";
import type { WalletData } from "../models/User.js";
import type { WalletTopUpInput } from "../validators/wallet.validator.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator.js";
import type { AuthResult } from "../services/user.service.js";

export type UserD = Omit<IUser, "password">;

export interface IUserServ {
    login(data: LoginInput): Promise<AuthResult>;
    userDetails(userId: string): Promise<UserD>;
    walletDetails(userId: string): Promise<WalletData>;
    topUpWallet(userId: string, data: WalletTopUpInput): Promise<WalletData>;
    registerUser(data: RegisterInput): Promise<AuthResult>;
}
