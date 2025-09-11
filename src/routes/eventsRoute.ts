import express from "express";
import { authenticateUser } from "../middleware";
import { createEvent, getAllEvents } from "../controllers/eventController";
const router = express.Router();

router.post("/create", authenticateUser, createEvent);
router.get("/", authenticateUser, getAllEvents);

export default router;
