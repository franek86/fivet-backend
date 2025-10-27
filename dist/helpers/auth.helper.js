"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.sendOtp = exports.trackOtpRequest = exports.checkOtpRestrictions = void 0;
const index_1 = __importDefault(require("../redis/index"));
const sendMail_1 = require("../utils/sendMail");
const errorHandler_1 = require("./errorHandler");
// Utility function to generate 6-digit OTP
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}
const checkOtpRestrictions = (email, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield index_1.default.get(`otp_lock:${email}`)) {
        return next(new errorHandler_1.ValidationError("Account locked due multiple failed attempts! Try again after 30 minutes."));
    }
    if (yield index_1.default.get(`otp_spam_lock:${email}`)) {
        return next(new errorHandler_1.ValidationError("Too many OTP requests! Please wait 1 hour before requesting again."));
    }
    if (yield index_1.default.get(`otp_cooldown:${email}`)) {
        return next(new errorHandler_1.ValidationError("Please wait 1 minute before requesting a new OTP."));
    }
});
exports.checkOtpRestrictions = checkOtpRestrictions;
const trackOtpRequest = (email, next) => __awaiter(void 0, void 0, void 0, function* () {
    const otpRequestKey = `otp_request_count:${email}`;
    let otpRequests = parseInt((yield index_1.default.get(otpRequestKey)) || "0");
    if (otpRequests >= 2) {
        yield index_1.default.set(`otp_spam_lock:${email}`, "locked", "EX", 3600); // locak for 1 hour
        throw new errorHandler_1.ValidationError("Too many OTP requests. Please wait 1 hour before requesting again");
    }
    yield index_1.default.set(otpRequestKey, otpRequests + 1, "EX", 3600);
});
exports.trackOtpRequest = trackOtpRequest;
const sendOtp = (name, email, template) => __awaiter(void 0, void 0, void 0, function* () {
    const otp = generateOTP();
    yield (0, sendMail_1.sendEmail)(email, "Verify your email", template, { name, otp });
    yield index_1.default.set(`otp:${email}`, otp, "EX", 300);
    yield index_1.default.set(`otp_cooldown:${email}`, "true", "EX", 60);
});
exports.sendOtp = sendOtp;
const verifyOtp = (email, otp, next) => __awaiter(void 0, void 0, void 0, function* () {
    const storedOtp = yield index_1.default.get(`otp:${email}`);
    if (!storedOtp)
        throw new errorHandler_1.ValidationError("Invalid or expired OTP!");
    const failedAttemptsKey = `otp_attempts:${email}`;
    const failedAttempts = parseInt((yield index_1.default.get(failedAttemptsKey)) || "0");
    if (storedOtp !== otp) {
        if (failedAttempts >= 2) {
            yield index_1.default.set(`otp_lock:${email}`, "locked", "EX", 1800); //Locked for 30 minutes
            yield index_1.default.del(`otp:${email}`, failedAttemptsKey);
            throw new errorHandler_1.ValidationError("Too many failed attempts. You account is locked for 30 minutes.");
        }
        yield index_1.default.set(failedAttemptsKey, failedAttempts + 1, "EX", 300);
        throw new errorHandler_1.ValidationError(`Inccorect OTP. ${2 - failedAttempts} attemps left.`);
    }
    yield index_1.default.del(`otp:${email}`, failedAttemptsKey);
});
exports.verifyOtp = verifyOtp;
