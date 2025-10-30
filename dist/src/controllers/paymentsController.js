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
exports.getPayments = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const paymentFilters_1 = require("../utils/paymentFilters");
/* Get all payments
    ADMIN ONLY
*/
const getPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { where } = (0, paymentFilters_1.paymentFilters)(req.query);
        const data = yield prismaClient_1.default.payment.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({ data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getPayments = getPayments;
