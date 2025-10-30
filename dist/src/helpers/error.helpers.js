"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.DataBaseError = exports.ForbiddenError = exports.AuthError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode, isOperational = true, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this);
    }
}
exports.AppError = AppError;
//Not found error
class NotFoundError extends AppError {
    constructor(message = "Resources not found") {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
//Validation error
class ValidationError extends AppError {
    constructor(message = "Invalid request data", details) {
        super(message, 400, details);
    }
}
exports.ValidationError = ValidationError;
//Auth error
class AuthError extends AppError {
    constructor(message = "Unauthorizes") {
        super(message, 401);
    }
}
exports.AuthError = AuthError;
//Forbidden error
class ForbiddenError extends AppError {
    constructor(message = "Forbidden access") {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
//Database error
class DataBaseError extends AppError {
    constructor(message = "Database error", details) {
        super(message, 500, true, details);
    }
}
exports.DataBaseError = DataBaseError;
//Rate Limit error
class RateLimitError extends AppError {
    constructor(message = "Too many requests, please try again later") {
        super(message, 429);
    }
}
exports.RateLimitError = RateLimitError;
