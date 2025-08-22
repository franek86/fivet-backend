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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddressBook = exports.updateAddressBook = exports.createAddressBook = exports.getSingleAddressBook = exports.getAddressBook = void 0;
const addressBookSchema_1 = require("../schemas/addressBookSchema");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const errorHandler_1 = require("../helpers/errorHandler");
/*  GET ALL ADDRESS BOOK BASED ON USER ID*/
const getAddressBook = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.user;
    const { search } = req.query;
    if (!userId)
        throw new errorHandler_1.ValidationError("User ID can not found");
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
        return res.status(200).json(data);
    }
    catch (error) {
        next(error);
    }
});
exports.getAddressBook = getAddressBook;
/* GET SINGLE ADDRESS BOOK */
const getSingleAddressBook = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        throw new errorHandler_1.ValidationError("ID not found");
    try {
        const singleData = yield prismaClient_1.default.addressBook.findUnique({ where: { id } });
        if (!singleData)
            throw new errorHandler_1.ValidationError("Address book by id not found");
        return res.status(200).json(singleData);
    }
    catch (error) {
        next(error);
    }
});
exports.getSingleAddressBook = getSingleAddressBook;
/* CREATE ADDRESS BOOK ONLY USER */
const createAddressBook = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.user;
    const body = addressBookSchema_1.addressBookSchema.parse(req.body);
    try {
        const addressBookData = Object.assign(Object.assign({}, body), { userId });
        const createAddressBookData = yield prismaClient_1.default.addressBook.create({ data: addressBookData });
        return res.status(200).json(createAddressBookData);
    }
    catch (error) {
        console.log(error);
        return next(error);
    }
});
exports.createAddressBook = createAddressBook;
/* UPDATE ADDRESS BOOK */
const updateAddressBook = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        throw new errorHandler_1.ValidationError("ID does not exists.");
    const updateData = __rest(req.body, []);
    try {
        const uniqueAddressBook = yield prismaClient_1.default.addressBook.findUnique({ where: { id } });
        if (!uniqueAddressBook)
            throw new errorHandler_1.ValidationError("Address book not found");
        yield prismaClient_1.default.addressBook.update({
            where: { id },
            data: updateData,
        });
        return res.status(200).json({
            success: true,
            message: "Address book successfully updated.",
        });
    }
    catch (error) {
        console.log(error);
        return next(error);
    }
});
exports.updateAddressBook = updateAddressBook;
/* DELETE ADDRESS BOOK ONLY USER */
const deleteAddressBook = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        throw new errorHandler_1.ValidationError("ID does not exists.");
    try {
        const uniqueAddressBook = yield prismaClient_1.default.addressBook.findUnique({ where: { id } });
        if (!uniqueAddressBook)
            throw new errorHandler_1.ValidationError("Address book not found.");
        yield prismaClient_1.default.addressBook.delete({
            where: { id },
        });
        return res.status(200).json({
            message: `Address book by ${id} deleted successfully`,
        });
    }
    catch (error) {
        console.log(error);
        return next(error);
    }
});
exports.deleteAddressBook = deleteAddressBook;
