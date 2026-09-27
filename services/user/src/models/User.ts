import mongoose, { Schema } from "mongoose";

export interface IUser {
    id?: string;
    name: string;
    email: string;
    password: string;
    role: "user" | "admin";
}

export interface Transaction {
    amount: number;
    status: "SUCCESS" | "REFUNDED";
    orderId: string;
    type: "ORDER" | "TOP_UP";
}

export type WalletData = Pick<IWallet, "balance" | "transactions">;

export interface IWallet {
    id?: string;
    userId: string;
    balance: number;
    transactions: Transaction[];
}

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    refreshTokens: { type: [String], default: [], select: false },
});

const wltSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    balance: { type: Number, default: 0 },
    transactions: [
        {
            amount: { type: Number, required: true },
            status: {
                type: String,
                enum: ["SUCCESS", "REFUNDED"],
                default: "SUCCESS",
                required: true,
            },
            orderId: { type: String, required: true },
            type: {
                type: String,
                enum: ["ORDER", "TOP_UP"],
                default: "ORDER",
                required: true,
            },
        },
    ],
});

userSchema.set("timestamps", true);
userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);
export const Wallet = mongoose.model("Wallet", wltSchema);
