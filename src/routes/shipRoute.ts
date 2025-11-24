import express from "express";

import {
  createShip,
  deleteShip,
  getAllPublishedShips,
  getShipsNumericFields,
  getDashboardShips,
  getShip,
  updatePublishedShip,
  updateShip,
} from "../controllers/shipController";
import { authAdmin, authenticateUser } from "../middleware";
import upload from "../middleware/uploads";

const router = express.Router();

router.post(
  "/create",
  authenticateUser,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  createShip
);
router.get("/published", getAllPublishedShips);
router.get("/numeric-fields", getShipsNumericFields);
router.get("/", authenticateUser, getDashboardShips);
router.get("/:id", getShip);
router.patch("/:id", authenticateUser, upload.fields([{ name: "mainImage", maxCount: 1 }, { name: "images" }]), updateShip);
router.patch("/:id/publish", authenticateUser, authAdmin, updatePublishedShip);
router.delete("/:id", authenticateUser, deleteShip);
export default router;
