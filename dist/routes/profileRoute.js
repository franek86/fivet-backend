"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profileController_1 = require("../controllers/profileController");
const middleware_1 = require("../middleware");
const router = express_1.default.Router();
router.get("/", middleware_1.authenticateUser, middleware_1.authAdmin, profileController_1.getAllProfiles);
router.get("/:id", middleware_1.authenticateUser, profileController_1.getUserProfile);
exports.default = router;
