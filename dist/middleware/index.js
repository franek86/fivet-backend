"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authAdmin = exports.authenticateUser = void 0;
const verifyToken_1 = __importDefault(require("./verifyToken"));
exports.authenticateUser = verifyToken_1.default;
const verifyAdmin_1 = __importDefault(require("./verifyAdmin"));
exports.authAdmin = verifyAdmin_1.default;
