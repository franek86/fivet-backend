"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.resetUserPassword = exports.verifyForgotPassword = exports.forgotPassword = exports.logout = exports.userMe = exports.refreshToken = exports.loginUser = exports.verifyUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const error_helpers_1 = require("../helpers/error.helpers");
const auth_helpers_1 = require("../helpers/auth.helpers");
const setCookies_1 = require("../utils/cookies/setCookies");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const generateOtp_helpers_1 = require("../helpers/generateOtp.helpers");
const generateAccessToken = (userId, role, fullName, subscription, isActiveSubscription) => {
    return jsonwebtoken_1.default.sign({ userId, role, fullName, subscription, isActiveSubscription }, process.env.JWT_SECRET, { expiresIn: "5m" });
};
const generateRefreshToken = (userId, role, fullName, subscription, isActiveSubscription) => {
    return jsonwebtoken_1.default.sign({ userId, role, fullName, subscription, isActiveSubscription }, process.env.REFRESH_SECRET, {
        expiresIn: "7d",
    });
};
/*  REGISTER NEW USER WITH OTP */
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    try {
        const { email, fullName } = req.body;
        if (!emailRegex.test(email)) {
            throw new error_helpers_1.ValidationError("Invalid email format!");
        }
        const existingUser = yield prismaClient_1.default.user.findUnique({ where: { email } });
        if (existingUser)
            throw new error_helpers_1.ValidationError("User already exists with this email");
        /* await checkOtpRestrictions(email, next);
        await trackOtpRequest(email, next); */
        //existing otp
        // generate otp
        const otp = (0, generateOtp_helpers_1.generateOtp)(6);
        //Save OTP to database
        yield prismaClient_1.default.otp.create({
            data: {
                email,
                otp,
                expiresAt: new Date(Date.now() + 60 * 1000), // Expires in 1 minute
            },
        });
        yield (0, auth_helpers_1.sendOtp)(fullName, email, "user-activation-email", otp);
        res.status(200).json({ message: "OTP send to email. Please verify your account" });
    }
    catch (error) {
        next(error);
    }
});
exports.registerUser = registerUser;
/* VERIFY USER WITH OTP */
const verifyUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, fullName, password, subscription, otp } = req.body;
        if (!email || !fullName || !password || !subscription || !otp)
            return next(new error_helpers_1.ValidationError("All fields are required!"));
        const existingUser = yield prismaClient_1.default.user.findUnique({ where: { email } });
        if (existingUser)
            return next(new error_helpers_1.ValidationError("User already exists!"));
        //await verifyOtp(email, otp, next);
        const recordOtp = yield prismaClient_1.default.otp.findUnique({ where: { email } });
        if (!recordOtp) {
            res.status(400).json({ message: "OTP not found. Request a new one." });
            return;
        }
        if (recordOtp.expiresAt < new Date()) {
            yield prismaClient_1.default.otp.delete({ where: { email } });
            res.status(400).json({ message: "OTP expired. Request a new one." });
            return;
        }
        if (recordOtp.otp !== otp) {
            res.status(400).json({ message: "Invalid OTP" });
            return;
        }
        //Hash password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const newUser = yield prismaClient_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                subscription,
                isActiveSubscription: false,
                profile: {
                    create: {
                        fullName,
                    },
                },
            },
        });
        yield prismaClient_1.default.otp.delete({
            where: { email },
        });
        const accessToken = generateAccessToken(newUser.id, newUser.role, newUser.fullName, newUser.subscription, newUser.isActiveSubscription);
        const refreshToken = generateRefreshToken(newUser.id, newUser.role, newUser.fullName, newUser.subscription, newUser.isActiveSubscription);
        (0, setCookies_1.setCookie)(res, "access_token", accessToken, 5 * 60 * 1000);
        (0, setCookies_1.setCookie)(res, "refresh_token", refreshToken, 7 * 24 * 60 * 60 * 1000);
        res.status(201).json({
            success: true,
            message: "User registred successfully!",
        });
    }
    catch (error) {
        next(error);
    }
});
exports.verifyUser = verifyUser;
/* LOGIN USER WITH ACCESS AND REFRESH TOKEN */
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, rememberMe } = req.body;
        if (!email || !password)
            throw new error_helpers_1.ValidationError("Email and password are required!");
        const user = yield prismaClient_1.default.user.findUnique({ where: { email } });
        if (!user)
            throw new error_helpers_1.AuthError("User does not exists.");
        const validatePassword = yield bcryptjs_1.default.compare(password, user.password);
        if (!validatePassword)
            throw new error_helpers_1.AuthError("Invalid credentails");
        const accessToken = generateAccessToken(user.id, user.role, user.fullName, user.subscription, user.isActiveSubscription);
        const refreshToken = generateRefreshToken(user.id, user.role, user.fullName, user.subscription, user.isActiveSubscription);
        //update is active user
        yield prismaClient_1.default.user.update({
            where: { id: user.id },
            data: { isActive: true },
        });
        /*
          if is remember me, set token in 30 days other ways set token to 7 days
        */
        const refreshTokenExpiry = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        (0, setCookies_1.setCookie)(res, "access_token", accessToken, 5 * 60 * 1000); //5 minutes
        (0, setCookies_1.setCookie)(res, "refresh_token", refreshToken, refreshTokenExpiry); // 7 days
        res.json({
            message: "User loggedin successfully",
        });
    }
    catch (error) {
        next(error);
    }
});
exports.loginUser = loginUser;
/* REFRESH TOKEN */
const refreshToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refresh_token } = req.cookies;
        if (!refresh_token) {
            new error_helpers_1.ValidationError("Unauthorized! No refresh token");
        }
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_SECRET);
        if (!decoded || !decoded.userId || !decoded.role) {
            new jsonwebtoken_1.JsonWebTokenError("Forbidden! Invalid refresh token.");
        }
        const new_access_token = generateAccessToken(decoded.userId, decoded.role, decoded.fullName, decoded.subscription, decoded.isActiveSubscription);
        (0, setCookies_1.setCookie)(res, "access_token", new_access_token, 5 * 60 * 1000);
        res.json({
            success: true,
            accessToken: new_access_token,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.refreshToken = refreshToken;
/* AUTHENTICATED USER */
const userMe = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authUser = req.user;
        if (!authUser)
            throw new error_helpers_1.ValidationError("User not found.");
        const user = yield prismaClient_1.default.user.findUnique({
            where: { id: authUser === null || authUser === void 0 ? void 0 : authUser.userId },
            select: {
                id: true,
                email: true,
                role: true,
                subscription: true,
                verifyPayment: true,
                isActiveSubscription: true,
                isActive: true,
                profile: {
                    select: {
                        id: true,
                        avatar: true,
                        fullName: true,
                        userId: true,
                    },
                },
            },
        });
        if (!user)
            return res.status(500).json({ message: "User not found" });
        const result = {
            id: user.id,
            role: user.role,
            subscription: user.subscription,
            activeUser: user.isActive,
            verifyPayment: user.verifyPayment,
            isActiveSubscription: user.isActiveSubscription,
            profile: Object.assign(Object.assign({}, user.profile), { email: user.email }),
        };
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
exports.userMe = userMe;
/* LOGOUT AND CLEAR TOKENS */
const logout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.user;
        yield prismaClient_1.default.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
        res.clearCookie("refresh_token", { httpOnly: true, secure: false, sameSite: "strict" });
        res.clearCookie("access_token", { httpOnly: true, secure: false, sameSite: "strict" });
        res.json({ message: "Logged out successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.logout = logout;
/* FORGOT PASSWORD */
const forgotPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email)
            throw new error_helpers_1.ValidationError("Email is required");
        const user = yield prismaClient_1.default.user.findUnique({ where: { email } });
        if (!user)
            throw new error_helpers_1.ValidationError("User not found.");
        /* await checkOtpRestrictions(email, next);
        await trackOtpRequest(email, next); */
        // generate otp
        const otp = (0, generateOtp_helpers_1.generateOtp)(6);
        //Save OTP to database
        yield prismaClient_1.default.otp.update({
            where: { email },
            data: {
                otp,
                expiresAt: new Date(Date.now() + 60 * 1000), // Expires in 1 minute
            },
        });
        yield (0, auth_helpers_1.sendOtp)(user.fullName, email, "forgot-password-email", otp);
        res.status(200).json({ message: "OTP send to email. Please verify your account." });
    }
    catch (error) {
        next(error);
    }
});
exports.forgotPassword = forgotPassword;
/* VERIFY FORGOT PASSWORD OTP*/
const verifyForgotPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        if (!email || !otp)
            throw new error_helpers_1.ValidationError("Email and OTP are required");
        //await verifyOtp(email, otp, next);
        const recordOtp = yield prismaClient_1.default.otp.findUnique({ where: { email } });
        if (!recordOtp) {
            res.status(400).json({ message: "OTP not found. Request a new one." });
            return;
        }
        if (recordOtp.expiresAt < new Date()) {
            yield prismaClient_1.default.otp.delete({ where: { email } });
            res.status(400).json({ message: "OTP expired. Request a new one." });
            return;
        }
        if (recordOtp.otp !== otp) {
            res.status(400).json({ message: "Invalid OTP" });
            return;
        }
        res.status(200).json({ message: "OTP verified. You can reset you password" });
    }
    catch (error) {
        next(error);
    }
});
exports.verifyForgotPassword = verifyForgotPassword;
/* RESET USER PASSWORD */
const resetUserPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword)
            return next(new error_helpers_1.ValidationError("Email and passwords are required!"));
        const user = yield prismaClient_1.default.user.findUnique({ where: { email } });
        if (!user)
            return next(new error_helpers_1.NotFoundError("User not found"));
        //compare new password with the existing one
        const isSamePassword = yield bcryptjs_1.default.compare(newPassword, user.password);
        if (isSamePassword)
            return next(new error_helpers_1.ValidationError("Password can not be the same as old password"));
        //hash new password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashPassword = yield bcryptjs_1.default.hash(newPassword, salt);
        yield prismaClient_1.default.user.update({
            where: { email },
            data: { password: hashPassword },
        });
        res.status(200).json({ message: "Password reset successfully!" });
    }
    catch (error) {
        next(error);
    }
});
exports.resetUserPassword = resetUserPassword;
