import express from "express";
import { getAddressBook } from "../controllers/addressBookController";
import { authenticateUser } from "../middleware";

const router = express.Router();

router.get("/", authenticateUser, getAddressBook);

export default router;
