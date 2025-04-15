import express from "express";

import { createShipType, deleteShipType, getAllShipType, getShipType, updateShipType } from "../controllers/shipTypeController";
import { authAdmin, authenticateUser } from "../middleware";

const router = express.Router();

router.get("/", getShipType);
router.get("/all", getAllShipType);
router.post("/create", authenticateUser, authAdmin, createShipType);
router.patch("/edit/:id", authenticateUser, authAdmin, updateShipType);
router.delete("/:id", authenticateUser, authAdmin, deleteShipType);

export default router;
