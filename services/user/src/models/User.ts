import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }
});

const wltSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0 },
    transactions: [{
        amount: Number,
        status: {
            type: String,
            enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
            default: "PENDING"
        },
        orderId: String
    }]
});

export const User = mongoose.model("User", userSchema);
export const Wallet = mongoose.model("Wallet", wltSchema);