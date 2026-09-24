import type { IUser } from "../models/User.js";
import type { createDTO } from "./repo.interface.js";

export type UserD = Omit<IUser, "password">;

export interface IUserServ {
    login(data: loginDTO): Promise<loginRes>;
    userDetails(userId: string): Promise<UserD>;
    registerUser(data: createDTO): Promise<string>
}

export interface loginDTO {
    email: string,
    password: string
}

export interface loginRes {
    token: string,
    userId: string,
    role: string
}