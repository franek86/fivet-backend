"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../middleware");
const eventController_1 = require("../controllers/eventController");
const router = express_1.default.Router();
router.post("/create", middleware_1.authenticateUser, eventController_1.createEvent);
router.get("/", middleware_1.authenticateUser, eventController_1.getAllEvents);
exports.default = router;
