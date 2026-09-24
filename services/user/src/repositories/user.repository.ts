import type { createDTO, IUserRepo } from "../interfaces/repo.interface.js";
import { User, Wallet, type IUser } from "../models/User.js";

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
}