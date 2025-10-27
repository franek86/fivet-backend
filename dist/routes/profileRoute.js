"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profileController_1 = require("../controllers/profileController");
const middleware_1 = require("../middleware");
const uploads_1 = __importDefault(require("../middleware/uploads"));
const router = express_1.default.Router();
router.get("/", middleware_1.authenticateUser, middleware_1.authAdmin, profileController_1.getAllProfiles);
router.get("/:id", middleware_1.authenticateUser, profileController_1.getUserProfile);
router.post("/create", middleware_1.authenticateUser, uploads_1.default.single("avatar"), profileController_1.createProfile);
router.patch("/update", middleware_1.authenticateUser, uploads_1.default.single("avatar"), profileController_1.updateProfile);
router.delete("/:id", middleware_1.authenticateUser, middleware_1.authAdmin, profileController_1.deleteUserProfile);
exports.default = router;
