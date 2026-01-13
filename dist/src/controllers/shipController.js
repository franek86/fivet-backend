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
exports.deleteShip = exports.updateShip = exports.getShip = exports.getDashboardShips = exports.updatePublishedShip = exports.getShipsNumericFields = exports.getAllPublishedShips = exports.createShip = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const pagination_1 = require("../utils/pagination");
const cloudinaryConfig_1 = __importStar(require("../cloudinaryConfig"));
const ship_schema_1 = require("../schemas/ship.schema");
const shipFilters_1 = require("../utils/shipFilters");
const sort_helpers_1 = require("../helpers/sort.helpers");
const sendMail_1 = require("../utils/sendMail");
const date_helpers_1 = require("../helpers/date.helpers");
const notificationController_1 = require("./notificationController");
/* import { io, users } from "../services/socket.service"; */
/*
CREATE SHIP
Authenticate user can create ship
*/
const createShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId)
        res.status(401).json({ message: "Unauthorized" });
    try {
        const files = req.files;
        const { url: mainImageUrl, publicId: mainImageId } = yield (0, cloudinaryConfig_1.uploadSingleFile)(files["mainImage"][0].path, "ship/mainImage");
        const imagesData = yield (0, cloudinaryConfig_1.uploadMultipleFiles)(files["images"], "ship/images");
        const imagesUrls = imagesData === null || imagesData === void 0 ? void 0 : imagesData.map((i) => i.url);
        const imageIds = imagesData === null || imagesData === void 0 ? void 0 : imagesData.map((id) => id.publicId);
        const validateData = ship_schema_1.CreateShipSchema.parse(Object.assign(Object.assign({}, req.body), { mainImage: mainImageUrl, mainImagePublicId: mainImageId, images: imagesUrls, imageIds }));
        const newShip = yield prismaClient_1.default.ship.create({
            data: Object.assign(Object.assign({}, validateData), { userId: userId, mainImage: mainImageUrl, mainImagePublicId: mainImageId, images: imagesUrls, imageIds, isPublished: false }),
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
        const fullName = (_b = req.user) === null || _b === void 0 ? void 0 : _b.fullName;
        const shipLink = `${process.env.FRONTEND_URL}/ships/${newShip === null || newShip === void 0 ? void 0 : newShip.id}`;
        const emailData = {
            shipTitle: newShip.shipName,
            shipIMO: newShip.imo,
            createdAt: (0, date_helpers_1.formatDate)(newShip.createdAt.toISOString()),
            fullName: fullName,
            reviewUrl: shipLink,
        };
        const emailToSend = (_c = admin === null || admin === void 0 ? void 0 : admin.email) !== null && _c !== void 0 ? _c : "";
        /* add notification */
        if (req.user.role !== "ADMIN" && admin) {
            yield prismaClient_1.default.notification.create({
                data: {
                    message: `${fullName} created a new ship: ${newShip.shipName}`,
                    userId: admin.id,
                },
            });
            /* realtime notification via socket.io */
            /*   io.to("admin").emit("newShipAdded", {
              shipId: newShip.id,
              shipName: newShip.shipName,
              createdBy: fullName,
              createdAt: formatDate(newShip.createdAt.toISOString()),
            }); */
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
                select: {
                    id: true,
                    shipName: true,
                    imo: true,
                    typeId: true,
                    refitYear: true,
                    buildYear: true,
                    price: true,
                    location: true,
                    latitude: true,
                    longitude: true,
                    mainEngine: true,
                    lengthOverall: true,
                    beam: true,
                    length: true,
                    depth: true,
                    draft: true,
                    tonnage: true,
                    cargoCapacity: true,
                    buildCountry: true,
                    remarks: true,
                    description: true,
                    mainImage: true,
                    images: true,
                    createdAt: true,
                },
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
  GET SHIPS STATISTIC FOR NUMBERIC FIELDS. THAT WILL USE ON FRONTEND TO TAKE MINMAX NUMERIC FIELDS
*/
// GET /ships/stats
const getShipsNumericFields = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Compute min/max for numeric fields across all published ships
        const numericStats = yield prismaClient_1.default.ship.aggregate({
            where: { isPublished: true },
            _min: { beam: true, tonnage: true, draft: true, length: true, cargoCapacity: true, depth: true, price: true },
            _max: { beam: true, tonnage: true, draft: true, length: true, cargoCapacity: true, depth: true, price: true },
        });
        res.status(200).json({ numericStats });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getShipsNumericFields = getShipsNumericFields;
/*
PUBLISH SHIPS ADMIN ONLY
*/
const updatePublishedShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { isPublished } = req.body;
    if (!id) {
        res.status(401).json({ message: "Id is required" });
        return;
    }
    try {
        const updatedShip = yield prismaClient_1.default.ship.update({ where: { id }, data: { isPublished } });
        if (isPublished && updatedShip.userId) {
            console.log("Published");
            /*  if (userSocketId) {
              io.to(userSocketId).emit("postApproved", {
                message: `Your "${updatedShip.shipName}" are published live!`,
                id: updatedShip.id,
                createdAt: formatDate(updatedShip.createdAt.toISOString()),
              });
            } else {
              console.log(`User ${updatedShip.userId} not connected, skipping notification`);
            } */
            yield (0, notificationController_1.sendNotification)(updatedShip.userId, `Your "${updatedShip.shipName}" are published live!`, "INFO");
        }
        res.status(200).json(updatedShip);
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
        let mainImageId = existingShip.mainImagePublicId;
        let imagesUrls = existingShip.images || [];
        let imageIds = existingShip.imageIds || [];
        /* main image update */
        if ((_b = (_a = files === null || files === void 0 ? void 0 : files["mainImage"]) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.path) {
            //Delete old image from cloudinary
            if (mainImageId) {
                yield cloudinaryConfig_1.default.uploader.destroy(mainImageId);
            }
            //upload new main image
            const uploadMainImage = yield (0, cloudinaryConfig_1.uploadSingleFile)(files["mainImage"][0].path, "ship/mainImage");
            mainImageUrl = uploadMainImage.url;
            mainImageId = uploadMainImage.publicId;
        }
        /* DELETE OLD IMAGES THAT USER WANTS TO REMOVE */
        let deleteImageIds = [];
        if (req.body.deleteImageIds) {
            deleteImageIds = JSON.parse(req.body.deleteImageIds);
        }
        // 1. delete selected images from Cloudinary
        for (const publicId of deleteImageIds) {
            try {
                yield cloudinaryConfig_1.default.uploader.destroy(publicId);
            }
            catch (err) {
                console.log("Failed to delete image:", publicId);
            }
        }
        // 2. remove them from arrays
        imageIds = imageIds.filter((id) => !deleteImageIds.includes(id));
        imagesUrls = imagesUrls.filter((_, index) => !deleteImageIds.includes(existingShip.imageIds[index]));
        /* Multiple image update */
        if (files === null || files === void 0 ? void 0 : files["images"]) {
            const newImages = yield (0, cloudinaryConfig_1.uploadMultipleFiles)(files["images"], "ship/images");
            //add new images
            imagesUrls = [...imagesUrls, ...newImages.map((img) => img.url)];
            imageIds = [...imageIds, ...newImages.map((img) => img.publicId)];
        }
        const updatedShip = yield prismaClient_1.default.ship.update({
            where: { id },
            data: Object.assign(Object.assign({}, parsed), { mainImage: mainImageUrl, mainImagePublicId: mainImageId, images: imagesUrls, imageIds: imageIds }),
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
