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
const errorHandler_1 = require("../helpers/errorHandler");
const auth_helper_1 = require("../helpers/auth.helper");
const setCookies_1 = require("../utils/cookies/setCookies");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const generateAccessToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "5m" });
};
const generateRefreshToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ userId, role }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
};
/*  REGISTER NEW USER WITH OTP */
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    try {
        const { email, fullName } = req.body;
        if (!emailRegex.test(email)) {
            throw new errorHandler_1.ValidationError("Invalid email format!");
        }
        const existingUser = yield prismaClient_1.default.user.findUnique({ where: { email } });
        if (existingUser)
            throw new errorHandler_1.ValidationError("User already exists with this email");
        yield (0, auth_helper_1.checkOtpRestrictions)(email, next);
        yield (0, auth_helper_1.trackOtpRequest)(email, next);
        yield (0, auth_helper_1.sendOtp)(fullName, email, "user-activation-email");
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
        const { email, fullName, password, otp } = req.body;
        if (!email || !fullName || !password || !otp)
            return next(new errorHandler_1.ValidationError("All fields are required!"));
        const existingUser = yield prismaClient_1.default.user.findUnique({ where: { email } });
        if (existingUser)
            return next(new errorHandler_1.ValidationError("User already exists!"));
        yield (0, auth_helper_1.verifyOtp)(email, otp, next);
        //Hash password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        yield prismaClient_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                profile: { create: { fullName } },
            },
        });
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
        const { email, password } = req.body;
        if (!email || !password)
            throw new errorHandler_1.ValidationError("Email and password are required!");
        const user = yield prismaClient_1.default.user.findUnique({ where: { email } });
        if (!user)
            throw new errorHandler_1.AuthError("User does not exists.");
        const validatePassword = yield bcryptjs_1.default.compare(password, user.password);
        if (!validatePassword)
            throw new errorHandler_1.AuthError("Invalid credentails");
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id, user.role);
        (0, setCookies_1.setCookie)(res, "access_token", accessToken, 5 * 60 * 1000);
        (0, setCookies_1.setCookie)(res, "refresh_token", refreshToken, 7 * 24 * 60 * 60 * 1000);
        res.json({
            message: "User loggedin successfully",
            //user: { id: user.id, email: user.email },
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
            return new errorHandler_1.ValidationError("Unauthorized! No refresh token");
        }
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_SECRET);
        if (!decoded || !decoded.userId || !decoded.role) {
            return new jsonwebtoken_1.JsonWebTokenError("Forbidden! Invalid refresh token.");
        }
        const new_access_token = generateAccessToken(decoded.userId, decoded.role);
        (0, setCookies_1.setCookie)(res, "access_token", new_access_token, 5 * 60 * 1000);
        console.log(new_access_token);
        console.log(decoded);
        return res.json({
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
            throw new errorHandler_1.ValidationError("User not found.");
        const user = yield prismaClient_1.default.user.findUnique({
            where: { id: authUser === null || authUser === void 0 ? void 0 : authUser.userId },
            select: {
                id: true,
                email: true,
                role: true,
                profile: {
                    select: {
                        id: true,
                        fullName: true,
                        avatar: true,
                        userId: true,
                    },
                },
            },
        });
        if (!user || !user.profile)
            return res.status(500).json({ message: "User not found" });
        const result = {
            id: user.id,
            role: user.role,
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
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("refresh_token", { httpOnly: true, secure: false, sameSite: "strict" });
    res.clearCookie("access_token", { httpOnly: true, secure: false, sameSite: "strict" });
    res.json({ message: "Logged out successfully" });
});
exports.logout = logout;
/* FORGOT PASSWORD */
const forgotPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email)
            throw new errorHandler_1.ValidationError("Email is required");
        const user = yield prismaClient_1.default.user.findUnique({ where: { email } });
        if (!user)
            throw new errorHandler_1.ValidationError("User not found.");
        yield (0, auth_helper_1.checkOtpRestrictions)(email, next);
        yield (0, auth_helper_1.trackOtpRequest)(email, next);
        yield (0, auth_helper_1.sendOtp)(user.fullName, email, "forgot-password-email");
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
            throw new errorHandler_1.ValidationError("Email and OTP are required");
        yield (0, auth_helper_1.verifyOtp)(email, otp, next);
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
            return next(new errorHandler_1.ValidationError("Email and passwords are required!"));
        const user = yield prismaClient_1.default.user.findUnique({ where: { email } });
        if (!user)
            return next(new errorHandler_1.NotFoundError("User not found"));
        //compare new password with the existing one
        const isSamePassword = yield bcryptjs_1.default.compare(newPassword, user.password);
        if (isSamePassword)
            return next(new errorHandler_1.ValidationError("Password can not be the same as old password"));
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
