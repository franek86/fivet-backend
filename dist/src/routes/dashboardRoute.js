"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../middleware");
const dashboardController_1 = require("../controllers/dashboardController");
const router = express_1.default.Router();
router.get("/statistic", middleware_1.authenticateUser, dashboardController_1.getDashboardStatistic);
exports.default = router;
