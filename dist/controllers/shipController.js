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
exports.deleteShip = exports.updateShip = exports.getShip = exports.getDashboardShips = exports.getAllPublishedShips = exports.createShip = void 0;
const client_1 = require("@prisma/client");
const pagination_1 = require("../helpers/pagination");
const cloudinaryConfig_1 = require("../cloudinaryConfig");
const prisma = new client_1.PrismaClient();
/*
CREATE SHIP
Authenticate user can create ship
*/
const createShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { shipName, imo, refitYear, buildYear, price, location, mainEngine, lengthOverall, beam, length, depth, draft, tonnage, cargoCapacity, buildCountry, remarks, description, userId, typeId, } = req.body;
    const files = req.files;
    let mainImageUrl = "";
    let imagesUrls = [];
    try {
        if ((_b = (_a = files === null || files === void 0 ? void 0 : files["mainImage"]) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.path) {
            mainImageUrl = yield (0, cloudinaryConfig_1.uploadSingleFile)(files["mainImage"][0].path, "ship/mainImage");
        }
        if (files === null || files === void 0 ? void 0 : files["images"]) {
            imagesUrls = yield (0, cloudinaryConfig_1.uploadMultipleFiles)(files["images"], "ship/images");
        }
        const shipData = yield prisma.ship.create({
            data: {
                shipName,
                imo,
                refitYear,
                buildYear,
                price,
                location,
                mainEngine,
                lengthOverall,
                beam,
                length,
                depth,
                draft,
                tonnage,
                cargoCapacity,
                buildCountry,
                remarks,
                description,
                mainImage: mainImageUrl,
                images: imagesUrls,
                isPublished: false,
                user: {
                    connect: { id: userId },
                },
                shipType: {
                    connect: { id: typeId },
                },
            },
        });
        return res.status(200).json({
            message: "Ship added successfully! Awaiting admin approval.",
            data: shipData,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
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
        const { pageNumber, pageSize, skip } = (0, pagination_1.getPaginationParams)(req.query);
        const ships = yield prisma.ship.findMany({
            skip,
            take: pageSize,
            where: { isPublished: true },
            orderBy: { createdAt: "desc" },
        });
        const totalShips = yield prisma.ship.count();
        return res.status(200).json({
            page: pageNumber,
            limit: pageSize,
            totalShips,
            totalPages: Math.ceil(totalShips / pageSize),
            data: ships,
        });
    }
    catch (error) { }
});
exports.getAllPublishedShips = getAllPublishedShips;
/*
GET ALL SHIPS
Get all ships from admin published or not published. Users can see only their own ships
TO DO: add filters
*/
const getDashboardShips = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, role } = req.user;
    const { shipType, status, search } = req.query;
    const { pageNumber, pageSize, skip } = (0, pagination_1.getPaginationParams)(req.query);
    try {
        let ships;
        const whereCondition = {};
        // Apply filters if provided
        if (shipType) {
            whereCondition.shipType = Array.isArray(shipType) ? { in: shipType } : shipType;
        }
        if (status) {
            whereCondition.status;
        }
        if (search) {
            whereCondition.OR = [
                {
                    shipName: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    shipName: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ];
        }
        if (role !== "ADMIN") {
            whereCondition.userId = userId;
        }
        const totalShipsType = (ships = yield prisma.ship.count());
        ships = yield prisma.ship.findMany({
            skip,
            take: pageSize,
            where: whereCondition,
        });
        return res.status(200).json({
            message: "Ships fetched successfully.",
            page: pageNumber,
            limit: pageSize,
            totalShipsType,
            totalPages: Math.ceil(totalShipsType / pageSize),
            data: ships,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Error fetching dashboard data." });
    }
});
exports.getDashboardShips = getDashboardShips;
/* GET SINGLE SHIP BY ID */
const getShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () { });
exports.getShip = getShip;
/*
UPDATE SHIPS BY ID
Admin can update all ship, but users can only update their own ships
*/
const updateShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { shipName, typeId, imo, refitYear, buildYear, price, location, mainEngine, lengthOverall, beam, length, depth, draft, tonnage, cargoCapacity, buildCountry, remarks, description, mainImage, images, } = req.body;
    try {
        const ship = yield prisma.ship.findUnique({ where: { id } });
        if (!ship) {
            return res.status(404).json({ message: "Ship not found" });
        }
        const updatedShip = yield prisma.ship.update({
            where: { id },
            data: {
                shipName,
                typeId,
                imo,
                refitYear,
                buildYear,
                price,
                location,
                mainEngine,
                lengthOverall,
                beam,
                length,
                depth,
                draft,
                tonnage,
                cargoCapacity,
                buildCountry,
                remarks,
                description,
                mainImage,
                images,
            },
        });
        return res.status(200).json({
            message: "Ship updated successfully",
            data: updatedShip,
        });
    }
    catch (error) {
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
        const ship = yield prisma.ship.findUnique({ where: { id } });
        if (!ship) {
            return res.status(404).json({ message: "Ship not found" });
        }
        yield prisma.ship.delete({
            where: { id },
        });
        return res.status(200).json({
            message: "Ship deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteShip = deleteShip;
