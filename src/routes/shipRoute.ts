import express from "express";

import { createShip, deleteShip, getAllPublishedShips, getDashboardShips, updateShip } from "../controllers/shipController";
import { authenticateUser } from "../middleware";

const router = express.Router();

router.post("/create", authenticateUser, createShip);
router.get("/published", getAllPublishedShips);
router.get("/", authenticateUser, getDashboardShips);
router.patch("/:id", authenticateUser, updateShip);
router.delete("/:id", authenticateUser, deleteShip);
export default router;
