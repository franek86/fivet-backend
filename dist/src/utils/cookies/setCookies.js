"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCookie = void 0;
const setCookie = (res, name, value) => {
    res.cookie(name, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // TO DO: in production sameSite must be true
        //maxAge: 5 * 60 * 1000, // TO DO: set to 7 days
    });
};
exports.setCookie = setCookie;
