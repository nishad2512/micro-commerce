import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
        return res.status(422).json({
            success: false,
            message: "Validation failed",
            errors: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
        });
    }

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message, error: { code: error.code } });
    }

    console.error("Unhandled user-service error", error);
    return res.status(500).json({ success: false, message: "An unexpected error occurred", error: { code: "INTERNAL_ERROR" } });
};
