import { User, type IUser } from "../models/User.js";


export interface IUserRepo {
    createUser: (user: createDTO) => Promise<IUser>;
    createWallet: (userId: string) => Promise<void>;
    findUserByEmail: (email: string) => Promise<IUser | null>;
    findUserById: (id: string) => Promise<IUser | null>;
}

export interface createDTO {
    name: string,
    email: string,
    password: string
}