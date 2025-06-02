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
exports.updateProfile = exports.createProfile = exports.getUserProfile = exports.getAllProfiles = void 0;
const client_1 = require("@prisma/client");
const cloudinaryConfig_1 = __importDefault(require("../cloudinaryConfig"));
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
/* GET ALL USER PROFILE
ONLY ADMIN CAN SEE ALL USER
*/
const getAllProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prisma.profile.findMany({ include: { user: { select: { email: true } } } });
        const result = data.map((p) => ({
            id: p.id,
            fullName: p.fullName,
            avatar: p.avatar,
            userId: p.userId,
            email: p.user.email,
        }));
        return res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getAllProfiles = getAllProfiles;
/* GET SINGLE USER PROFILE BY ID */
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId } = req.user;
    if (!id)
        return res.status(400).json({ message: "User ID is required" });
    if (!userId)
        return res.status(401).json({ message: "User ID can not found" });
    const parsedId = parseInt(id);
    try {
        const data = yield prisma.profile.findUnique({ where: { id: parsedId } });
        if (!data) {
            return res.status(404).json({ message: "Profile not found" });
        }
        return res.status(200).json({ data });
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
        const profileData = yield prisma.profile.create({
            data: {
                userId,
                fullName,
                avatar,
            },
        });
        res.status(200).json({ message: "Succefully created profile", data: profileData });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.createProfile = createProfile;
/* UPDATE PROFILE */
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { fullName, email } = req.body;
    const userId = req.body.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
    try {
        const existingProfile = yield prisma.profile.findUnique({
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
        const [updateProfile, updateUser] = yield prisma.$transaction([
            prisma.profile.update({
                where: { userId },
                data: {
                    fullName: fullName !== null && fullName !== void 0 ? fullName : existingProfile.fullName,
                    avatar: avatarUrl,
                },
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    email: email !== null && email !== void 0 ? email : existingProfile.user.email,
                },
            }),
        ]);
        return res.status(200).json({ message: "Profile updated", profile: Object.assign(Object.assign({}, updateProfile), { email: updateUser.email }) });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.updateProfile = updateProfile;
