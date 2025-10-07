"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../middleware");
const notificationController_1 = require("../controllers/notificationController");
const router = express_1.default.Router();
router.get("/", middleware_1.authenticateUser, middleware_1.authAdmin, notificationController_1.getNotifications);
router.get("/unread", middleware_1.authenticateUser, middleware_1.authAdmin, notificationController_1.getUnreadNotification);
router.put("/:id/read", middleware_1.authenticateUser, middleware_1.authAdmin, notificationController_1.updateUnreadNotification);
router.delete("/:id", middleware_1.authenticateUser, middleware_1.authAdmin, notificationController_1.deleteNotification);
exports.default = router;
