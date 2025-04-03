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
exports.getShipType = exports.deleteShipType = exports.updateShipType = exports.createShipType = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/* CREATE SHIP TYPE BY ADMIN
  Only admin can create ship type
*/
const createShipType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description } = req.body;
    try {
        const createNewData = yield prisma.shipType.create({
            data: {
                name,
                description,
            },
        });
        return res.status(200).json({
            message: "Ship type added successfully!",
            data: createNewData,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.createShipType = createShipType;
/* UPDATE SHIP TYPE BY ADMIN
  Only admin can edit ship type
*/
const updateShipType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        return res.status(400).json({ message: "Shipt type id could not found" });
    const { name, description } = req.body;
    try {
        const shipType = yield prisma.shipType.findUnique({ where: { id } });
        if (!shipType)
            return res.status(404).json({ message: "Ship type is required" });
        const updateShipType = yield prisma.shipType.update({
            where: { id },
            data: {
                name,
                description,
            },
        });
        return res.status(200).json({ message: "Ship type updated successfully", data: updateShipType });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateShipType = updateShipType;
/* DELETE SHIP TYPE BY ID FOR ADMIN
  Only admin can delete ship type
*/
const deleteShipType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        return res.status(400).json({ message: "Ship type ID is required" });
    try {
        const findShipType = yield prisma.shipType.findUnique({ where: { id } });
        if (!findShipType)
            return res.status(404).json({ message: "Ship type could not found" });
        yield prisma.shipType.delete({ where: { id } });
        return res.status(200).json({ message: "Ship type deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteShipType = deleteShipType;
/* GET ALL SHIP TYPE
  Public route
*/
const getShipType = () => __awaiter(void 0, void 0, void 0, function* () { });
exports.getShipType = getShipType;
