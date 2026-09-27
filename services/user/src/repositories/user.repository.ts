import type { createDTO, IUserRepo } from "../interfaces/repo.interface.js";
import crypto from "node:crypto";
import { User, Wallet, type IUser, type WalletData } from "../models/User.js";

export class UserRepo implements IUserRepo {
    async createUser(user: createDTO): Promise<IUser> {
        return await User.create(user);
    }

    async createWallet(userId: string): Promise<void> {
        await Wallet.create({ userId });
    }

    async findUserByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({ email });
    }

    async findUserById(id: string): Promise<IUser | null> {
        return await User.findById(id);
    }

    async findWalletByUserId(userId: string): Promise<WalletData | null> {
        const wallet = await Wallet.findOne({ userId }).select("balance transactions");
        return wallet ? this.toWalletData(wallet) : null;
    }

    async addWalletFunds(userId: string, amount: number): Promise<WalletData | null> {
        const wallet = await Wallet.findOneAndUpdate(
            { userId },
            {
                $inc: { balance: amount },
                $push: {
                    transactions: {
                        amount,
                        orderId: `TOPUP-${crypto.randomUUID()}`,
                        status: "SUCCESS",
                        type: "TOP_UP",
                    },
                },
            },
            { new: true, runValidators: true },
        ).select("balance transactions");
        return wallet ? this.toWalletData(wallet) : null;
    }

    private toWalletData(wallet: NonNullable<Awaited<ReturnType<typeof Wallet.findOne>>>): WalletData {
        return {
            balance: wallet.balance,
            transactions: wallet.transactions.map((transaction) => {
                if (
                    typeof transaction.amount !== "number" ||
                    typeof transaction.orderId !== "string" ||
                    (transaction.status !== "SUCCESS" &&
                        transaction.status !== "REFUNDED") ||
                    (transaction.type !== "ORDER" && transaction.type !== "TOP_UP")
                ) {
                    throw new Error("Wallet contains an invalid transaction");
                }
                return {
                    amount: transaction.amount,
                    orderId: transaction.orderId,
                    status: transaction.status,
                    type: transaction.type,
                };
            }),
        };
    }

    async addRefreshToken(userId: string, tokenHash: string): Promise<void> {
        await User.findByIdAndUpdate(userId, { $addToSet: { refreshTokens: tokenHash } });
    }

    async hasRefreshToken(userId: string, tokenHash: string): Promise<boolean> {
        return (await User.findOne({ _id: userId, refreshTokens: tokenHash }).select("_id")) !== null;
    }

    async replaceRefreshToken(userId: string, oldTokenHash: string, newTokenHash: string): Promise<boolean> {
        const result = await User.updateOne({ _id: userId, refreshTokens: oldTokenHash }, { $pull: { refreshTokens: oldTokenHash } });
        if (result.modifiedCount !== 1) return false;
        await User.updateOne({ _id: userId }, { $addToSet: { refreshTokens: newTokenHash } });
        return true;
    }

    async removeRefreshToken(userId: string, tokenHash: string): Promise<void> {
        await User.updateOne({ _id: userId }, { $pull: { refreshTokens: tokenHash } });
    }
}
