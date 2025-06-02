"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const addressBookController_1 = require("../controllers/addressBookController");
const middleware_1 = require("../middleware");
const router = express_1.default.Router();
router.get("/", middleware_1.authenticateUser, addressBookController_1.getAddressBook);
router.post("/create", middleware_1.authenticateUser, addressBookController_1.createAddressBook);
exports.default = router;
