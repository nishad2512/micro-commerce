import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { IUserRepo } from "../interfaces/repo.interface.js";
import type { IUserServ, UserD } from "../interfaces/serv.interface.js";
import type { WalletData } from "../models/User.js";
import {
    AuthenticationError,
    ConflictError,
    NotFoundError,
} from "../errors/app-error.js";
import type {
    LoginInput,
    RegisterInput,
} from "../validators/auth.validator.js";
import type { WalletTopUpInput } from "../validators/wallet.validator.js";

export interface AuthResult {
    accessToken: string;
    refreshToken: string;
    user: UserD;
}
type TokenPayload = JwtPayload & { sub: string; role: "user" | "admin" };

const requireSecret = (name: string): string => {
    const value = process.env[name];
    if (!value || value.length < 6)
        throw new Error(
            `${name} must be configured with at least 6 characters`,
        );
    return value;
};
const hashToken = (token: string): string =>
    crypto.createHash("sha256").update(token).digest("hex");
const sign = (
    payload: TokenPayload,
    secret: string,
    expiresIn: string,
): string => jwt.sign(payload, secret, { expiresIn } as SignOptions);

export class UserService implements IUserServ {
    constructor(private readonly repo: IUserRepo) {}

    async login(data: LoginInput): Promise<AuthResult> {
        const user = await this.repo.findUserByEmail(data.email);
        if (!user || !(await bcrypt.compare(data.password, user.password)))
            throw new AuthenticationError("Invalid email or password");
        return this.createSession(
            user.id as string,
            user.role,
            user.name,
            user.email,
        );
    }

    async registerUser(data: RegisterInput): Promise<AuthResult> {
        if (await this.repo.findUserByEmail(data.email))
            throw new ConflictError(
                "An account with this email already exists",
            );
        const user = await this.repo.createUser({
            ...data,
            password: await bcrypt.hash(data.password, 12),
        });
        await this.repo.createWallet(user.id as string);
        return this.createSession(
            user.id as string,
            user.role,
            user.name,
            user.email,
        );
    }

    async refresh(refreshToken: string): Promise<AuthResult> {
        const payload = this.verifyRefresh(refreshToken);
        if (
            !(await this.repo.hasRefreshToken(
                payload.sub,
                hashToken(refreshToken),
            ))
        )
            throw new AuthenticationError("Refresh token is no longer valid");
        const user = await this.userDetails(payload.sub);
        const next = this.issueTokens(user.id as string, user.role);
        if (
            !(await this.repo.replaceRefreshToken(
                payload.sub,
                hashToken(refreshToken),
                hashToken(next.refreshToken),
            ))
        )
            throw new AuthenticationError("Refresh token is no longer valid");
        return { ...next, user };
    }

    async logout(refreshToken: string | undefined): Promise<void> {
        if (!refreshToken) return;
        try {
            const payload = this.verifyRefresh(refreshToken);
            await this.repo.removeRefreshToken(
                payload.sub,
                hashToken(refreshToken),
            );
        } catch {
            /* Logout is intentionally idempotent. */
        }
    }

    async userDetails(userId: string): Promise<UserD> {
        const user = await this.repo.findUserById(userId);
        if (!user) throw new NotFoundError("User not found");
        return {
            id: user.id as string,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }

    async walletDetails(userId: string): Promise<WalletData> {
        const wallet = await this.repo.findWalletByUserId(userId);
        if (!wallet) throw new NotFoundError("Wallet not found");
        return wallet;
    }

    async topUpWallet(userId: string, data: WalletTopUpInput): Promise<WalletData> {
        const wallet = await this.repo.addWalletFunds(userId, data.amount);
        if (!wallet) throw new NotFoundError("Wallet not found");
        return wallet;
    }

    private async createSession(
        id: string,
        role: "user" | "admin",
        name: string,
        email: string,
    ): Promise<AuthResult> {
        const tokens = this.issueTokens(id, role);
        await this.repo.addRefreshToken(id, hashToken(tokens.refreshToken));
        return { ...tokens, user: { id, name, email, role } };
    }

    private issueTokens(
        id: string,
        role: "user" | "admin",
    ): Pick<AuthResult, "accessToken" | "refreshToken"> {
        const payload: TokenPayload = { sub: id, role };
        return {
            accessToken: sign(
                payload,
                requireSecret("JWT_ACCESS_SECRET"),
                process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
            ),
            refreshToken: sign(
                payload,
                requireSecret("JWT_REFRESH_SECRET"),
                process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",
            ),
        };
    }

    private verifyRefresh(token: string): TokenPayload {
        const decoded = jwt.verify(token, requireSecret("JWT_REFRESH_SECRET"));
        if (
            typeof decoded === "string" ||
            !decoded.sub ||
            (decoded.role !== "user" && decoded.role !== "admin")
        )
            throw new AuthenticationError("Invalid refresh token");
        return decoded as TokenPayload;
    }
}
