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
exports.createAddressBook = exports.getAddressBook = void 0;
const client_1 = require("@prisma/client");
const addressBookSchema_1 = require("../schemas/addressBookSchema");
const prisma = new client_1.PrismaClient();
/*
    GET ALL ADDRESS BOOK BASED ON USER ID
*/
const getAddressBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.user;
    if (!userId)
        return res.status(401).json({ message: "User ID can not found" });
    try {
        const data = yield prisma.addressBook.findMany({ where: { userId } });
        return res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getAddressBook = getAddressBook;
/* CREATE ADDRESS BOOK ONLY USER */
const createAddressBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.user;
    const body = addressBookSchema_1.addressBookSchema.parse(req.body);
    try {
        const addressBookData = Object.assign(Object.assign({}, body), { userId });
        const createAddressBookData = yield prisma.addressBook.create({ data: addressBookData });
        return res.status(200).json(createAddressBookData);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});
exports.createAddressBook = createAddressBook;
