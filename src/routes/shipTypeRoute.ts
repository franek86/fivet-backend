import express from "express";

import { createShipType, deleteShipType, getAllShipType, getShipType, updateShipType } from "../controllers/shipTypeController";
import { authenticateUser, requireRole } from "../middleware/verifyToken";

const router = express.Router();

router.get("/", getShipType);
router.get("/all", getAllShipType);
router.post("/create", authenticateUser, requireRole("ADMIN"), createShipType);
router.patch("/edit/:id", authenticateUser, requireRole("ADMIN"), updateShipType);
router.delete("/:id", authenticateUser, requireRole("ADMIN"), deleteShipType);

export default router;
