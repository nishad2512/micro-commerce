import type { NextFunction, Request, Response } from "express";
import type { IUserServ } from "../interfaces/serv.interface.js";
import type { UserService } from "../services/user.service.js";
import { LoginSchema, RegisterSchema } from "../validators/auth.validator.js";
import { WalletTopUpSchema } from "../validators/wallet.validator.js";

const refreshCookie = "refresh_token";
const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
        | "none"
        | "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
});

export class UserController {
    constructor(
        private readonly serv: IUserServ &
            Pick<UserService, "refresh" | "logout">,
    ) {}

    public register = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const result = await this.serv.registerUser(
                RegisterSchema.parse(req.body),
            );
            res.cookie(refreshCookie, result.refreshToken, cookieOptions());
            res.status(201).json({
                success: true,
                message: "Account created",
                data: { accessToken: result.accessToken, user: result.user },
            });
        } catch (error) {
            next(error);
        }
    };

    public login = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const result = await this.serv.login(LoginSchema.parse(req.body));
            res.cookie(refreshCookie, result.refreshToken, cookieOptions());
            res.status(200).json({
                success: true,
                message: "Signed in",
                data: { accessToken: result.accessToken, user: result.user },
            });
        } catch (error) {
            next(error);
        }
    };

    public refresh = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const token = req.cookies?.[refreshCookie] as string | undefined;
            if (!token)
                return void res
                    .status(401)
                    .json({
                        success: false,
                        message: "Refresh token is required",
                        error: { code: "AUTHENTICATION_ERROR" },
                    });
            const result = await this.serv.refresh(token);
            res.cookie(refreshCookie, result.refreshToken, cookieOptions());
            res.status(200).json({
                success: true,
                data: { accessToken: result.accessToken, user: result.user },
            });
        } catch (error) {
            next(error);
        }
    };

    public logout = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            await this.serv.logout(
                req.cookies?.[refreshCookie] as string | undefined,
            );
            res.clearCookie(refreshCookie, cookieOptions());
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    public me = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            res.status(200).json({
                success: true,
                data: await this.serv.userDetails(req.user!.sub),
            });
        } catch (error) {
            next(error);
        }
    };

    public wallet = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            res.status(200).json({
                success: true,
                data: await this.serv.walletDetails(req.user!.sub),
            });
        } catch (error) {
            next(error);
        }
    };

    public topUpWallet = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const data = WalletTopUpSchema.parse(req.body);
            res.status(200).json({
                success: true,
                message: "Dummy funds added",
                data: await this.serv.topUpWallet(req.user!.sub, data),
            });
        } catch (error) {
            next(error);
        }
    };

    public userData = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const userId = req.params.id;
            if (!userId || Array.isArray(userId))
                return void res
                    .status(400)
                    .json({ success: false, message: "User id is required" });
            res.status(200).json({
                success: true,
                data: await this.serv.userDetails(userId),
            });
        } catch (error) {
            next(error);
        }
    };
}
