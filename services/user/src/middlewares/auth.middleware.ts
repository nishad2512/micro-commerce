import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
    AuthenticationError,
    AuthorizationError,
} from "../errors/app-error.js";

const accessSecret = (): string => {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.length < 6)
        throw new Error(
            "JWT_ACCESS_SECRET must be configured with at least 32 characters",
        );
    return secret;
};

export const verifyUser = (
    req: Request,
    _res: Response,
    next: NextFunction,
): void => {
    try {
        const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) throw new AuthenticationError("A bearer token is required");
        const payload = jwt.verify(token, accessSecret());
        if (
            typeof payload === "string" ||
            !payload.sub ||
            (payload.role !== "user" && payload.role !== "admin")
        )
            throw new AuthenticationError("Invalid access token");
        req.user = payload as NonNullable<Request["user"]>;
        next();
    } catch (error) {
        next(
            error instanceof AuthenticationError
                ? error
                : new AuthenticationError("Invalid or expired access token"),
        );
    }
};

export const adminOnly = (
    req: Request,
    _res: Response,
    next: NextFunction,
): void => {
    if (req.user?.role !== "admin") return next(new AuthorizationError());
    next();
};
