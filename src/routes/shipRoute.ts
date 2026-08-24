import express from "express";

import {
  createShip,
  deleteShip,
  getAllPublishedShips,
  getPublishedShip,
  getShipsNumericFields,
  getDashboardShips,
  getShip,
  updatePublishedShip,
  updateShip,
} from "../controllers/shipController";

import upload from "../middleware/uploads";
import { authenticateUser, requireRole } from "../middleware/verifyToken";

const router = express.Router();

router.post(
  "/create",
  authenticateUser,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  createShip,
);
router.get("/published", getAllPublishedShips);
router.get("/published/:slug", getPublishedShip);
router.get("/numeric-fields", getShipsNumericFields);
router.get("/", authenticateUser, getDashboardShips);
router.get("/:id", getShip);
router.patch("/:id", authenticateUser, upload.fields([{ name: "mainImage", maxCount: 1 }, { name: "images" }]), updateShip);
router.patch("/:id/publish", authenticateUser, requireRole("ADMIN"), updatePublishedShip);
router.delete("/:id", authenticateUser, deleteShip);
export default router;
