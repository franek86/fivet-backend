import express from "express";

import {
  createShip,
  deleteShip,
  getAllPublishedShips,
  getDashboardShips,
  getShip,
  updatePublishedShip,
  updateShip,
} from "../controllers/shipController";
import { authAdmin, authenticateUser } from "../middleware";
import upload from "../middleware/uploads";
import { getDashboardStatistic } from "../controllers/shipTypeController";

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
router.get("/", authenticateUser, getDashboardShips);
router.get("/dashboard/statistic", authenticateUser, getDashboardStatistic);
router.get("/:id", getShip);
router.patch("/:id", authenticateUser, upload.fields([{ name: "mainImage", maxCount: 1 }, { name: "images" }]), updateShip);
router.patch("/:id/publish", authenticateUser, authAdmin, updatePublishedShip);
router.delete("/:id", authenticateUser, deleteShip);
export default router;
