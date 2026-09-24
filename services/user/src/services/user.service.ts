import mongoose from "mongoose";
import { User, Wallet } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { createDTO, IUserRepo } from "../interfaces/repo.interface.js";
import type {
    IUserServ,
    loginDTO,
    loginRes,
    UserD,
} from "../interfaces/serv.interface.js";

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

export class UserService implements IUserServ {
    constructor(private repo: IUserRepo) {}

    async login(data: loginDTO): Promise<loginRes> {
        const { email, password } = data;
        const user = await this.repo.findUserByEmail(email);
        if (!user) {
            throw new Error("User not found!");
        }
        if (!(await bcrypt.compare(password, user.password))) {
            throw new Error("Invalid credentials!");
        }
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "24h" },
        );

        return { token, userId: user.id as string, role: user.role };
    }

    async userDetails(userId: string): Promise<UserD> {
        if (!userId) {
            throw new Error("UserID not provided");
        }
        const user = await this.repo.findUserById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return {
            id: userId,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }

    async registerUser(data: createDTO): Promise<string> {
        const { name, email, password } = data;
        const passHash = await bcrypt.hash(password, 12);

        const user = await this.repo.createUser({
            name,
            email,
            password: passHash,
        });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "24h" },
        );

        await this.repo.createWallet(user.id as string);

        return token;
    }
}
