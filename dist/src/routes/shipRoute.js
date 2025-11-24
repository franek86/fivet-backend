"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shipController_1 = require("../controllers/shipController");
const middleware_1 = require("../middleware");
const uploads_1 = __importDefault(require("../middleware/uploads"));
const router = express_1.default.Router();
router.post("/create", middleware_1.authenticateUser, uploads_1.default.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "images", maxCount: 10 },
]), shipController_1.createShip);
router.get("/published", shipController_1.getAllPublishedShips);
router.get("/numeric-fields", shipController_1.getShipsNumericFields);
router.get("/", middleware_1.authenticateUser, shipController_1.getDashboardShips);
router.get("/:id", shipController_1.getShip);
router.patch("/:id", middleware_1.authenticateUser, uploads_1.default.fields([{ name: "mainImage", maxCount: 1 }, { name: "images" }]), shipController_1.updateShip);
router.patch("/:id/publish", middleware_1.authenticateUser, middleware_1.authAdmin, shipController_1.updatePublishedShip);
router.delete("/:id", middleware_1.authenticateUser, shipController_1.deleteShip);
exports.default = router;
