import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthenticationError } from "../errors/app-error.js";

export const verifyUser = (req: Request, _res: Response, next: NextFunction): void => {
    try {
        const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!token || !secret) throw new AuthenticationError("A valid bearer token is required");
        const payload = jwt.verify(token, secret);
        if (typeof payload === "string" || !payload.sub || (payload.role !== "user" && payload.role !== "admin")) throw new AuthenticationError("Invalid access token");
        req.user = payload as NonNullable<Request["user"]>;
        next();
    } catch (error) { next(error instanceof AuthenticationError ? error : new AuthenticationError("Invalid or expired access token")); }
};
