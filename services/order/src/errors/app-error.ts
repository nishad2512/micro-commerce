export class AppError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly code: string,
    ) {
        super(message);
    }
}
export class AuthenticationError extends AppError {
    constructor(message = "Authentication required") {
        super(message, 401, "AUTHENTICATION_ERROR");
    }
}
export class AuthorizationError extends AppError {
    constructor(message = "You are not allowed to perform this action") {
        super(message, 403, "AUTHORIZATION_ERROR");
    }
}
export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404, "NOT_FOUND");
    }
}
export class DownstreamError extends AppError {
    constructor(message: string) {
        super(message, 503, "DOWNSTREAM_UNAVAILABLE");
    }
}
