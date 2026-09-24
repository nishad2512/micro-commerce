import mongoose, { Schema } from "mongoose";

export interface IUser {
    id?: string;
    name: string;
    email: string;
    password: string;
    role: "user" | "admin";
}

interface Transaction {
    amount: number,
    status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED",
    orderId: string
}

export interface IWallet {
    id?: string,
    userId: string,
    balance: string,
    transactions: Transaction[]
}

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
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
            amount: Number,
            status: {
                type: String,
                enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
                default: "PENDING",
            },
            orderId: String,
        },
    ],
});

export const User = mongoose.model("User", userSchema);
export const Wallet = mongoose.model("Wallet", wltSchema);
