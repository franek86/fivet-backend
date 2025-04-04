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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.getAllProfiles = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/* GET ALL USER PROFILE
ONLY ADMIN CAN SEE ALL USER
*/
const getAllProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prisma.profile.findMany();
        return res.status(200).json({ message: "Successfully get profiles", data });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getAllProfiles = getAllProfiles;
/* GET USER PROFILE BY USER ID */
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
