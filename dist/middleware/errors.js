"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler_1 = require("../helpers/errorHandler");
const errorMiddleware = (err, req, res, next) => {
    if (err instanceof errorHandler_1.AppError) {
        console.log(`Error ${req.method} ${req.url} - ${err.message}`);
        return res.status(err.statusCode).json(Object.assign({ status: "error", message: err.message }, (err.details && { details: err.details })));
    }
    console.error("Unhandled error:", {
        message: err.message,
        stack: err.stack,
    });
    return res.status(500).json({ status: "error", error: "Something went wrong, please try again" });
};
exports.default = errorMiddleware;
