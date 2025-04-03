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
const prisma = new client_1.PrismaClient();
/*
CREATE SHIP
Authenticate user can create ship
*/
const createShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { shipName, imo, refitYear, buildYear, price, location, mainEngine, lengthOverall, beam, length, depth, draft, tonnage, cargoCapacity, buildCountry, remarks, description, mainImage, images, userId, typeId, } = req.body;
    try {
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
                mainImage,
                images,
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
        console.error("Error creating ship:", error);
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
        const { page, limit } = req.query;
        const pageNumber = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 10;
        const skip = (pageNumber - 1) * pageSize;
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
*/
const getDashboardShips = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, role } = req.user;
    try {
        let ships;
        if (role === "ADMIN") {
            ships = yield prisma.ship.findMany();
        }
        else {
            ships = yield prisma.ship.findMany({
                where: { userId },
            });
        }
        return res.status(200).json({
            message: "Ships fetched successfully.",
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
