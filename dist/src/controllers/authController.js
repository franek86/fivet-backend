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
exports.resetUserPassword = exports.logout = exports.refreshToken = exports.userMe = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("../helpers/errorHandler");
const auth_helper_1 = require("../helpers/auth.helper");
const prisma = new client_1.PrismaClient();
const ACCESS_EXPIRES_IN = 60 * 15;
const REFRESH_EXPIRES_IN = 60 * 60 * 5;
const generateAccessToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
};
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};
/*  REGISTER USER */
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    try {
        const { email, password, fullName } = req.body;
        if (!emailRegex.test(email)) {
            return new errorHandler_1.ValidationError("Invalid email format!");
        }
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return next(new errorHandler_1.ValidationError("User already exists with this email"));
        yield (0, auth_helper_1.checkOtpRestrictions)(email, next);
        yield (0, auth_helper_1.trackOtpRequest)(email, next);
        yield (0, auth_helper_1.sendOtp)(fullName, email, "user-activation-email");
        //Hash password
        /*const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
    
           await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            profile: { create: { fullName } },
          },
        }); */
        res.status(200).json({ message: "OTP send to email. Please verify your account" });
    }
    catch (error) {
        return next(error);
    }
});
exports.registerUser = registerUser;
/* LOGIN USER WITH ACCESS AND REFRESH TOKEN */
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(400).json({ message: "Invalid credentails" });
        const validatePassword = yield bcryptjs_1.default.compare(password, user.password);
        if (!validatePassword)
            return res.status(400).json({ message: "Invalid credentails" });
        const access_token = generateAccessToken(user.id, user.role);
        const refresh_token = generateRefreshToken(user.id);
        const expires_at = Math.floor(Date.now() / 1000) + ACCESS_EXPIRES_IN;
        res.cookie("refresh_token", refresh_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" }); // NOTE: In production mode secure must be true
        res.cookie("access_token", access_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" }); // NOTE: In production mode secure must be true
        res.json({
            access_token,
            expires_at,
            expires_in: ACCESS_EXPIRES_IN,
            refresh_token,
            user: { id: user.id, email: user.email, role: user.role },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.loginUser = loginUser;
/* AUTHENTICATED USER */
const userMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield prisma.user.findUnique({
        where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId },
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
});
exports.userMe = userMe;
/* REFRESH TOKEN */
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refresh_token } = req.cookies;
    if (!refresh_token) {
        return res.status(401).json({ message: "No refresh token provided" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_SECRET);
        const new_access_token = generateAccessToken(decoded.userId, decoded.role);
        const new_expires_at = Math.floor(Date.now() / 1000) + ACCESS_EXPIRES_IN;
        return res.json({
            access_token: new_access_token,
            expires_at: new_expires_at,
            expires_in: ACCESS_EXPIRES_IN,
            refresh_token,
        });
    }
    catch (error) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }
});
exports.refreshToken = refreshToken;
/* LOGOUT AND CLEAR TOKENS */
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("refresh_token", { httpOnly: true, secure: false, sameSite: "strict" });
    res.clearCookie("access_token", { httpOnly: true, secure: false, sameSite: "strict" });
    res.json({ message: "Logged out successfully" });
});
exports.logout = logout;
/* RESET USER PASSWORD */
const resetUserPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword)
            return next(new errorHandler_1.ValidationError("Email and passwords are required!"));
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user)
            return next(new errorHandler_1.NotFoundError("User not found"));
        //compare new password with the existing one
        const isSamePassword = yield bcryptjs_1.default.compare(newPassword, user.password);
        if (isSamePassword)
            return next(new errorHandler_1.ValidationError("Password cannot be same"));
        //hash new password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashPassword = yield bcryptjs_1.default.hash(newPassword, salt);
        yield prisma.user.update({
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
