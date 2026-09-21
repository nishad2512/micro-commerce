import mongoose from "mongoose";
import { User, Wallet } from "../models/User.js";
import grpc from "@grpc/grpc-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// gRPC

export const createUser = async (call: any, callback: any) => {
    const session = await mongoose.startSession();
    const { name, email, password } = call.request;
    try {
        const passHash = await bcrypt.hash(password, 12);
        const token = await session.withTransaction(async () => {
            const users = await User.create(
                [{ name, email, password: passHash }],
                { session },
            );
            const user = users[0];

            const token = jwt.sign(
                { id: user?._id, role: user?.role },
                process.env.JWT_SECRET || "secret",
                { expiresIn: "24h" },
            );

            await Wallet.create([{ userId: users[0]!._id }], { session });

            return token;
        });

        console.log("User successfully created", token);
        callback(null, {
            success: true,
            message: "User created successfully",
            token,
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

// const authHeader = call.metadata.get("authorization")[0];

//         if (!authHeader || !authHeader.startsWith("Bearer ")) {
//             return callback({
//                 code: grpc.status.UNAUTHENTICATED,
//                 message: "Missing or malformed authentication token",
//             });
//         }
//         const token = authHeader.split(" ")[1];
//         const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as { id?: string, role?: string }

export const meRPC = async (call: any, callback: any) => {
    try {
        const result = await userDetails(call.request.userId);

        callback(null, result);
    } catch (err: any) {
        console.error(err.message);
        callback({
            code: grpc.status.UNAUTHENTICATED,
            message: err.message || "User identification failed",
        });
    }
};

// express

export const loginUser = async (data: any) => {
    const { email, password } = data;
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("User not found!");
    }
    if (!(await bcrypt.compare(password, user.password))) {
        throw new Error("Invalid credentials!");
    }
    const token = jwt.sign(
        { id: user?._id, role: user?.role },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "24h" },
    );

    return { token, userId: user._id, role: user.role };
};

export const userDetails = async (userId?: string) => {
    if (!userId) {
        throw new Error("UserID not provided");
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    return {
        userId,
        name: user.name,
        email: user.email,
        role: user.role,
    };
};
