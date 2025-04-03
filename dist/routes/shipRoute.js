"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shipController_1 = require("../controllers/shipController");
const middleware_1 = require("../middleware");
const router = express_1.default.Router();
router.post("/create", middleware_1.authenticateUser, shipController_1.createShip);
router.get("/", shipController_1.getAllPublishedShips);
router.get("/all", middleware_1.authenticateUser, shipController_1.getDashboardShips);
router.patch("/:id", middleware_1.authenticateUser, shipController_1.updateShip);
router.delete("/:id", middleware_1.authenticateUser, shipController_1.deleteShip);
exports.default = router;
