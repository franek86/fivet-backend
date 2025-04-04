import express from "express";

import { createShipType, deleteShipType, getShipType, updateShipType } from "../controllers/shipTypeController";
import { authAdmin, authenticateUser } from "../middleware";

const router = express.Router();

router.get("/", getShipType);
router.post("/create", authenticateUser, authAdmin, createShipType);
router.patch("/edit/:id", authenticateUser, authAdmin, updateShipType);
router.delete("/:id", authenticateUser, authAdmin, deleteShipType);

export default router;
