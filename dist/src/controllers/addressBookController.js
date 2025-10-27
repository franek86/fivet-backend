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
exports.deleteAddressBook = exports.updateAddressBook = exports.createAddressBook = exports.getSingleAddressBook = exports.getAddressBook = void 0;
const addressBook_schema_1 = require("../schemas/addressBook.schema");
const prismaClient_1 = __importDefault(require("../prismaClient"));
/*  GET ALL ADDRESS BOOK BASED ON USER ID*/
const getAddressBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const { search } = req.query;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const whereCondition = {};
    if (userId)
        whereCondition.userId = userId;
    if (search && typeof search === "string" && search.trim().length > 0) {
        whereCondition.OR = [
            {
                fullName: {
                    contains: search.trim(),
                    mode: "insensitive",
                },
            },
            {
                email: { contains: search.trim(), mode: "insensitive" },
            },
        ];
    }
    try {
        const data = yield prismaClient_1.default.addressBook.findMany({ where: whereCondition, orderBy: { createdAt: "desc" } });
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAddressBook = getAddressBook;
/* GET SINGLE ADDRESS BOOK */
const getSingleAddressBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(401).json({ message: "Address book ID are required" });
        return;
    }
    try {
        const singleData = yield prismaClient_1.default.addressBook.findUnique({ where: { id } });
        if (!singleData) {
            res.status(404).json({ message: "Address book ID not found" });
            return;
        }
        res.status(200).json(singleData);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getSingleAddressBook = getSingleAddressBook;
/* CREATE ADDRESS BOOK ONLY USER */
const createAddressBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const body = addressBook_schema_1.AddressBookSchema.parse(req.body);
    try {
        const addressBookData = Object.assign(Object.assign({}, body), { userId });
        const createAddressBookData = yield prismaClient_1.default.addressBook.create({ data: addressBookData });
        res.status(201).json(createAddressBookData);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createAddressBook = createAddressBook;
/* UPDATE ADDRESS BOOK */
const updateAddressBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(401).json({ message: "Address book ID are required" });
        return;
    }
    const parsedData = addressBook_schema_1.UpdateAddressBookSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ errors: parsedData.error.errors });
        return;
    }
    const updateData = parsedData.data;
    //const { ...updateData } = req.body;
    try {
        const uniqueAddressBook = yield prismaClient_1.default.addressBook.findUnique({ where: { id } });
        if (!uniqueAddressBook) {
            res.status(404).json({ message: "Address book not found" });
            return;
        }
        yield prismaClient_1.default.addressBook.update({
            where: { id },
            data: updateData,
        });
        res.status(200).json({
            success: true,
            message: "Address book successfully updated.",
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateAddressBook = updateAddressBook;
/* DELETE ADDRESS BOOK ONLY USER */
const deleteAddressBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(401).json({ message: "Address book ID are required" });
        return;
    }
    try {
        const uniqueAddressBook = yield prismaClient_1.default.addressBook.findUnique({ where: { id } });
        if (!uniqueAddressBook) {
            res.status(404).json({ message: "Address book not found" });
            return;
        }
        yield prismaClient_1.default.addressBook.delete({
            where: { id },
        });
        res.status(200).json({
            message: `Address book by ${id} deleted successfully`,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteAddressBook = deleteAddressBook;
