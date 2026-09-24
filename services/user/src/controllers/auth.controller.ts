import type { Request, Response } from "express";
import type { IUserServ } from "../interfaces/serv.interface.js";

export class UserController {
    constructor(private serv: IUserServ) {}

    public async register(req: Request, res: Response) {
        try {
            const result = await this.serv.registerUser(req.body);

            res.status(200).json({ result });
        } catch (err: any) {
            res.json({
                success: false,
                message: err.message || "SignUp failed!",
            });
        }
    }

    public async login(req: Request, res: Response) {
        try {
            const result = await this.serv.login(req.body);

            res.status(200).json(result);
        } catch (err: any) {
            res.json({
                success: false,
                message: err.message || "Login failed!",
            });
        }
    }

    public async me(req: any, res: Response) {
        try {
            const result = await this.serv.userDetails(req!.user?.id);

            res.status(200).json(result);
        } catch (err: any) {
            res.json({
                success: false,
                message: err.message || "User identification failed",
            });
        }
    }

    public async userData(req: Request, res: Response) {
        try {
            const userId = req.params.id;
            const result = await this.serv.userDetails(userId as string);

            res.status(200).json(result);
        } catch (err: any) {
            res.json({
                success: false,
                message: err.message || "Users data finding failed",
            });
        }
    }
}
