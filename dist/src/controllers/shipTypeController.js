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
exports.getAllShipType = exports.getShipType = exports.deleteShipType = exports.updateShipType = exports.createShipType = void 0;
const pagination_1 = require("../utils/pagination");
const sort_helpers_1 = require("../helpers/sort.helpers");
const prismaClient_1 = __importDefault(require("../prismaClient"));
/* CREATE SHIP TYPE BY ADMIN
  Only admin can create ship type
*/
const createShipType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description } = req.body;
    try {
        const createNewData = yield prismaClient_1.default.shipType.create({
            data: {
                name,
                description,
            },
        });
        res.status(201).json({
            message: "Ship type added successfully!",
            data: createNewData,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createShipType = createShipType;
/* UPDATE SHIP TYPE BY ADMIN
  Only admin can edit ship type
*/
const updateShipType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "Ship type id could not found" });
        return;
    }
    const { name, description } = req.body;
    try {
        const shipType = yield prismaClient_1.default.shipType.findUnique({ where: { id } });
        if (!shipType) {
            res.status(404).json({ message: "Ship type is required" });
            return;
        }
        const updateShipType = yield prismaClient_1.default.shipType.update({
            where: { id },
            data: {
                name,
                description,
            },
        });
        res.status(200).json({ message: "Ship type updated successfully", data: updateShipType });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateShipType = updateShipType;
/* DELETE SHIP TYPE BY ID FOR ADMIN
  Only admin can delete ship type
*/
const deleteShipType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "Ship type ID is required" });
        return;
    }
    try {
        const findShipType = yield prismaClient_1.default.shipType.findUnique({ where: { id } });
        if (!findShipType) {
            res.status(404).json({ message: "Ship type could not found" });
            return;
        }
        yield prismaClient_1.default.shipType.delete({ where: { id } });
        res.status(200).json({ message: "Ship type deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteShipType = deleteShipType;
/* GET SHIP TYPE WITH PAGINATION AND SORT
  Public route
*/
const getShipType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = (0, pagination_1.parsePagination)(req.query);
    const { sortBy, search } = req.query;
    const orderBy = (0, sort_helpers_1.parseSortBy)(sortBy, ["name", "createdAt"], { createdAt: "desc" });
    const whereCondition = {};
    if (search && typeof search === "string" && search.trim().length > 0) {
        whereCondition.OR = [
            {
                name: {
                    contains: search.trim(),
                    mode: "insensitive",
                },
            },
            {
                description: { contains: search.trim(), mode: "insensitive" },
            },
        ];
    }
    try {
        const shipType = yield prismaClient_1.default.shipType.findMany({
            where: whereCondition,
            skip,
            take: skip,
            orderBy,
        });
        const total = yield prismaClient_1.default.shipType.count();
        const meta = (0, pagination_1.buildPageMeta)(total, page, limit);
        res.status(200).json({
            meta,
            data: shipType,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getShipType = getShipType;
/* GET ALL SHIP TYPE
  Public route
*/
const getAllShipType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shipType = yield prismaClient_1.default.shipType.findMany({
            orderBy: { name: "desc" },
        });
        res.status(200).json(shipType);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAllShipType = getAllShipType;
