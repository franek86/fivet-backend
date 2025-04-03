"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shipTypeController_1 = require("../controllers/shipTypeController");
const middleware_1 = require("../middleware");
const router = express_1.default.Router();
router.post("/create", middleware_1.authenticateUser, middleware_1.authAdmin, shipTypeController_1.createShipType);
router.patch("/edit/:id", middleware_1.authenticateUser, middleware_1.authAdmin, shipTypeController_1.updateShipType);
router.delete("/:id", middleware_1.authenticateUser, middleware_1.authAdmin, shipTypeController_1.deleteShipType);
exports.default = router;
