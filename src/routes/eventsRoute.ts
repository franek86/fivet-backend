import express from "express";
import { authenticateUser } from "../middleware";
import { createEvent, deleteEvent, getAllEvents, getSingleEvent, updateEventById } from "../controllers/eventController";
const router = express.Router();

router.post("/create", authenticateUser, createEvent);
router.get("/", authenticateUser, getAllEvents);
router.get("/:id", authenticateUser, getSingleEvent);
router.patch("/:id", authenticateUser, updateEventById);
router.delete("/:id", authenticateUser, deleteEvent);

export default router;
