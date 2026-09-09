import mongoose from "mongoose";
import { User, Wallet } from "../models/User.js";
import grpc from "@grpc/grpc-js";

export const createUser = async (call: any, callback: any) => {
    const session = await mongoose.startSession();
    const { name, email } = call.request;
    try {
        const userId = await session.withTransaction(async () => {
            const users = await User.create([{ name, email }], { session });

            await Wallet.create([{ userId: users[0]!._id }], { session });

            return users[0]!._id;
        });

        console.log("User successfully created", userId);
        callback(null, {
            success: true,
            message: "User created successfully",
            userId,
        });
    } catch (err: any) {
        console.error("User creation failed: ", err.message);
        callback({
            code: grpc.status.ABORTED,
            message: "User creation failed",
        });
    } finally {
        await session.endSession();
    }
};
