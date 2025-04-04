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
exports.logout = exports.refreshToken = exports.userMe = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const ACCESS_EXPIRES_IN = 60;
const REFRESH_EXPIRES_IN = 60 * 2;
const generateAccessToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
};
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};
/*  REGISTER USER */
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, fullName } = req.body;
    try {
        //Hash password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const user = yield prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                profile: { create: { fullName } },
            },
        });
        res.status(200).json({ message: "User registered successfully", user });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
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
        select: { id: true, email: true, profile: true, role: true },
    });
    if (!user)
        return res.status(500).json({ message: "User not found" });
    res.json({ user });
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
