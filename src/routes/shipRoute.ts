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
import { authAdmin, authenticateUser, checkShipsLimit } from "../middleware";
import upload from "../middleware/uploads";

const router = express.Router();

router.post(
  "/create",
  authenticateUser,
  checkShipsLimit,
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
router.patch("/:id/publish", authenticateUser, authAdmin, updatePublishedShip);
router.delete("/:id", authenticateUser, deleteShip);
export default router;
