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
exports.deleteShip = exports.updateShip = exports.getShip = exports.getDashboardShips = exports.updatePublishedShip = exports.getAllPublishedShips = exports.createShip = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const pagination_1 = require("../utils/pagination");
const cloudinaryConfig_1 = require("../cloudinaryConfig");
const ship_schema_1 = require("../schemas/ship.schema");
const shipFilters_1 = require("../utils/shipFilters");
const sort_helpers_1 = require("../helpers/sort.helpers");
const error_helpers_1 = require("../helpers/error.helpers");
const sendMail_1 = require("../utils/sendMail");
const date_helpers_1 = require("../helpers/date.helpers");
/*
CREATE SHIP
Authenticate user can create ship
*/
const createShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId)
        res.status(401).json({ message: "Unauthorized" });
    try {
        const files = req.files;
        let mainImageUrl = "";
        let imagesUrls = [];
        if ((_c = (_b = files === null || files === void 0 ? void 0 : files["mainImage"]) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.path) {
            mainImageUrl = yield (0, cloudinaryConfig_1.uploadSingleFile)(files["mainImage"][0].path, "ship/mainImage");
        }
        if (files === null || files === void 0 ? void 0 : files["images"]) {
            imagesUrls = yield (0, cloudinaryConfig_1.uploadMultipleFiles)(files["images"], "ship/images");
        }
        const validateData = ship_schema_1.CreateShipSchema.parse(Object.assign(Object.assign({}, req.body), { mainImage: mainImageUrl, images: imagesUrls }));
        const newShip = yield prismaClient_1.default.ship.create({
            data: Object.assign(Object.assign({}, validateData), { userId: userId, mainImage: mainImageUrl, images: imagesUrls, isPublished: false }),
        });
        /* call notification for admin when ship created */
        /* Find admin first */
        const admin = yield prismaClient_1.default.user.findFirst({
            where: { role: "ADMIN" },
            select: {
                id: true,
                email: true,
            },
        });
        const fullName = (_d = req.user) === null || _d === void 0 ? void 0 : _d.fullName;
        const shipLink = `${process.env.FRONTEND_URL}/ships/${newShip === null || newShip === void 0 ? void 0 : newShip.id}`;
        const emailData = {
            shipTitle: newShip.shipName,
            shipIMO: newShip.imo,
            createdAt: (0, date_helpers_1.formatDate)(newShip.createdAt.toISOString()),
            fullName: fullName,
            reviewUrl: shipLink,
        };
        const emailToSend = (_e = admin === null || admin === void 0 ? void 0 : admin.email) !== null && _e !== void 0 ? _e : "";
        /* add notification */
        if (req.user.role !== "ADMIN" && admin) {
            yield prismaClient_1.default.notification.create({
                data: {
                    message: `${fullName} created a new ship: ${newShip.shipName}`,
                    userId: admin.id,
                },
            });
            yield (0, sendMail_1.sendEmail)(emailToSend, "New Ship Pending Approval", "ship-notification-email", emailData);
        }
        res.status(200).json({
            message: "Ship added successfully! Awaiting admin approval.",
            data: newShip,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createShip = createShip;
/*
GET PUBLISHED SHIPS
It is public route. Get all published ships with pagination, sort, filters
TO DO: add filters
*/
const getAllPublishedShips = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit, skip } = (0, pagination_1.parsePagination)(req.query);
        const filters = (0, shipFilters_1.shipFilters)(req.query);
        const { sortBy } = req.query;
        const orderBy = (0, sort_helpers_1.parseSortBy)(sortBy, ["shipName", "price", "createdAt"], { createdAt: "desc" });
        const where = Object.assign({ isPublished: true }, filters);
        const [ships, totalShips] = yield Promise.all([
            prismaClient_1.default.ship.findMany({
                skip,
                take: limit,
                where,
                orderBy,
            }),
            prismaClient_1.default.ship.count({ where }),
        ]);
        const meta = (0, pagination_1.buildPageMeta)(totalShips, page, limit);
        res.status(200).json({
            meta,
            data: ships,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAllPublishedShips = getAllPublishedShips;
/*
PUBLISH SHIPS ADMIN ONLY
*/
const updatePublishedShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { isPublished } = req.body;
    if (!id)
        throw new error_helpers_1.ValidationError("Ship id not found");
    try {
        const updateShip = yield prismaClient_1.default.ship.update({ where: { id }, data: { isPublished } });
        res.status(200).json(updateShip);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updatePublishedShip = updatePublishedShip;
/*
GET ALL SHIPS
Get all ships from admin published or not published. Users can see only their own ships
TO DO: filter by status
*/
const getDashboardShips = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, role } = req.user;
    const { page, limit, skip } = (0, pagination_1.parsePagination)(req.query);
    const { sortBy } = req.query;
    const filters = (0, shipFilters_1.shipFilters)(req.query);
    try {
        let data;
        const whereCondition = Object.assign({}, filters);
        // Sort handling
        if (role !== "ADMIN") {
            whereCondition.userId = userId;
        }
        const orderBy = (0, sort_helpers_1.parseSortBy)(sortBy, ["shipName", "price", "createdAt"], { createdAt: "desc" });
        const totalShips = (data = yield prismaClient_1.default.ship.count());
        data = yield prismaClient_1.default.ship.findMany({
            skip,
            take: limit,
            where: whereCondition,
            orderBy,
            include: {
                user: {
                    select: {
                        profile: {
                            select: {
                                fullName: true,
                            },
                        },
                    },
                },
                shipType: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        const meta = (0, pagination_1.buildPageMeta)(totalShips, page, limit);
        return res.status(200).json({
            message: "Ships fetched successfully.",
            meta,
            data,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error fetching dashboard data." });
    }
});
exports.getDashboardShips = getDashboardShips;
/* GET SINGLE SHIP BY ID */
const getShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        return res.status(404).json({ message: "Ship id are not found!" });
    try {
        const ship = yield prismaClient_1.default.ship.findUnique({
            where: { id },
            include: {
                shipType: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (!ship) {
            return res.status(404).json({ message: "Ship not found" });
        }
        return res.status(200).json(ship);
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.getShip = getShip;
/*
UPDATE SHIPS BY ID
Admin can update all ship, but users can only update their own ships
*/
const updateShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    try {
        const existingShip = yield prismaClient_1.default.ship.findUnique({ where: { id } });
        if (!existingShip) {
            return res.status(404).json({ message: "Ship not found" });
        }
        const body = Object.assign(Object.assign({}, req.body), { isPublished: req.body.isPublished === "true" });
        // Validate body
        const parsed = ship_schema_1.EditShipSchema.parse(body);
        const files = req.files;
        let mainImageUrl = existingShip.mainImage;
        let imagesUrls = existingShip.images || [];
        if ((_b = (_a = files === null || files === void 0 ? void 0 : files["mainImage"]) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.path) {
            mainImageUrl = yield (0, cloudinaryConfig_1.uploadSingleFile)(files["mainImage"][0].path, "ship/mainImage");
        }
        if (files === null || files === void 0 ? void 0 : files["images"]) {
            const newImages = yield (0, cloudinaryConfig_1.uploadMultipleFiles)(files["images"], "ship/images");
            imagesUrls = [...imagesUrls, ...newImages];
        }
        const updatedShip = yield prismaClient_1.default.ship.update({
            where: { id },
            data: Object.assign(Object.assign({}, parsed), { mainImage: mainImageUrl, images: imagesUrls }),
        });
        return res.status(200).json({
            message: "Ship updated successfully",
            data: updatedShip,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateShip = updateShip;
/*
DELETE SHIP BY ID
Admin can delete all ship, but users can only delete their own ships
*/
const deleteShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const ship = yield prismaClient_1.default.ship.findUnique({ where: { id } });
        if (!ship) {
            res.status(404).json({ message: "Ship not found" });
        }
        yield prismaClient_1.default.ship.delete({
            where: { id },
        });
        res.status(200).json({
            message: "Ship deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteShip = deleteShip;
