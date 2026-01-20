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
exports.deleteUserProfile = exports.updateProfile = exports.createProfile = exports.getUserProfile = exports.getLastFiveProfile = exports.getAllProfiles = void 0;
const cloudinaryConfig_1 = __importDefault(require("../cloudinaryConfig"));
const fs_1 = __importDefault(require("fs"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
const error_helpers_1 = require("../helpers/error.helpers");
/* GET ALL USER PROFILE
ONLY ADMIN CAN SEE ALL USER
*/
const getAllProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = req.query;
    const whereCondition = {};
    if (search && typeof search === "string" && search.trim().length > 0) {
        whereCondition.OR = [
            {
                fullName: {
                    contains: search.trim(),
                    mode: "insensitive",
                },
            },
        ];
    }
    try {
        const usersData = yield prismaClient_1.default.user.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true,
                subscription: true,
                lastLogin: true,
                createdAt: true,
                profile: {
                    select: {
                        avatar: true,
                    },
                },
            },
            where: whereCondition,
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json(usersData);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAllProfiles = getAllProfiles;
/* GET LAST FIVE CREATED PROFILE */
const getLastFiveProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prismaClient_1.default.user.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true,
                subscription: true,
                lastLogin: true,
                createdAt: true,
                profile: {
                    select: {
                        avatar: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
        });
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getLastFiveProfile = getLastFiveProfile;
/* GET SINGLE USER PROFILE BY ID */
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId } = req.user;
    if (!id)
        res.status(400).json({ message: "User ID is required" });
    if (!userId)
        res.status(401).json({ message: "User ID can not found" });
    const parsedId = parseInt(id);
    try {
        const data = yield prismaClient_1.default.profile.findUnique({ where: { id: parsedId } });
        if (!data) {
            res.status(404).json({ message: "Profile not found" });
        }
        res.status(200).json({ data });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getUserProfile = getUserProfile;
/* CREATE PROFILE  */
const createProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { userId, fullName } = req.body;
    const avatar = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
    try {
        const profileData = yield prismaClient_1.default.profile.create({
            data: {
                userId,
                fullName,
                avatar,
            },
        });
        res.status(200).json({ message: "Succefully created profile", data: profileData });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createProfile = createProfile;
/* UPDATE PROFILE */
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { fullName, email } = req.body;
    const userId = req.body.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
    try {
        const existingProfile = yield prismaClient_1.default.profile.findUnique({
            where: { userId },
            include: { user: true },
        });
        if (!existingProfile)
            return res.status(404).json({ message: "Profile not found" });
        let avatarUrl = existingProfile.avatar;
        if (req.file) {
            const upload = yield cloudinaryConfig_1.default.uploader.upload(req.file.path, {
                folder: "avatars",
                transformation: [{ width: 150, height: 150, crop: "fill" }],
            });
            avatarUrl = upload.secure_url;
            if (fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
        }
        const [updateProfile, updateUser] = yield prismaClient_1.default.$transaction([
            prismaClient_1.default.profile.update({
                where: { userId },
                data: {
                    fullName: fullName !== null && fullName !== void 0 ? fullName : existingProfile.fullName,
                    avatar: avatarUrl,
                },
            }),
            prismaClient_1.default.user.update({
                where: { id: userId },
                data: {
                    email: email !== null && email !== void 0 ? email : existingProfile.user.email,
                },
            }),
        ]);
        return res.status(200).json({ message: "Profile updated", profile: Object.assign(Object.assign({}, updateProfile), { email: updateUser.email }) });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateProfile = updateProfile;
/* DELETE USER PROFILE ADMIN ONLY */
const deleteUserProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params.id);
    if (!id)
        throw new error_helpers_1.ValidationError("ID must be a valid number.");
    try {
        const userProfile = yield prismaClient_1.default.profile.findUnique({ where: { id } });
        if (!userProfile) {
            return next(new error_helpers_1.ValidationError("User profile not found."));
        }
        yield prismaClient_1.default.$transaction([prismaClient_1.default.profile.delete({ where: { id } }), prismaClient_1.default.user.delete({ where: { id: userProfile.userId } })]);
        res.status(200).json({ message: "User and profile deleted successfully." });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteUserProfile = deleteUserProfile;
