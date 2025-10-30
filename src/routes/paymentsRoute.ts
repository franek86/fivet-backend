import express from "express";
import { getPayments } from "../controllers/paymentsController";
import { authAdmin, authenticateUser } from "../middleware";

const router = express.Router();

router.get("/", /* authenticateUser, authAdmin */ getPayments);

export default router;
