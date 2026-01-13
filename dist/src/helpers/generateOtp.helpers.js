"use strict";
/**
 * Generate a numeric OTP (One-Time Password) of a given length
 * @param length - number of digits in the OTP (default is 6)
 * @returns OTP as a string, padded with leading zeros if necessary
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = void 0;
const generateOtp = (length = 6) => {
    return Math.floor(Math.random() * Math.pow(10, length))
        .toString()
        .padStart(length, "0");
};
exports.generateOtp = generateOtp;
