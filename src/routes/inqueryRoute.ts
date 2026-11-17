import express from "express";
import rateLimit from "express-rate-limit";
const router = express.Router();

import {
  createInquiry,
  deleteInquiry,
  getMyInquiries,
  saveInquirySenderToAddressBook,
  updateInqueryStatus,
} from "../controllers/inqueryController";
import { authenticateUser, requireRole } from "../middleware/verifyToken";

export const inquiryLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 5, standardHeaders: true });

router.post("/ships/:shipId/inquiries", inquiryLimiter, createInquiry);
router.get("/", authenticateUser, requireRole("ADMIN", "BROKER", "OWNER"), getMyInquiries);
router.patch("/:id/status", authenticateUser, updateInqueryStatus);
router.delete("/:id", authenticateUser, deleteInquiry);
router.post("/:id/address-book", authenticateUser, saveInquirySenderToAddressBook);

export default router;
